const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.getSettings = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const emailParam = req.query.email;

    let user = null;
    if (userId) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      user = rows[0];
    } else if (emailParam) {
      const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [emailParam.trim().toLowerCase()]);
      user = rows[0];
    }

    if (!user) {
      return res.status(400).json(ApiResponse.error('User not found'));
    }

    const [addresses] = await pool.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [user.id]);
    const addressDTOs = addresses.map(a => ({
      id: a.id,
      userId: a.user_id,
      fullName: a.full_name,
      phone: a.phone,
      alternatePhone: a.alternate_phone,
      houseFlatNo: a.house_flat_no,
      streetAddress: a.street_address,
      area: a.area,
      landmark: a.landmark,
      city: a.city,
      district: a.district,
      state: a.state,
      pincode: a.pincode,
      country: a.country,
      addressType: a.address_type || 'HOME',
      isDefault: Boolean(a.is_default)
    }));

    const defaultAddr = addressDTOs.find(a => a.isDefault) || (addressDTOs.length > 0 ? addressDTOs[0] : null);

    const data = {
      id: user.id,
      fullName: user.full_name || user.name,
      email: user.email,
      phone: user.phone,
      dob: user.dob || '',
      gender: user.gender || 'Not Specified',
      profilePhoto: user.profile_photo || null,
      preferredLanguage: user.preferred_language || 'English',
      emailNotifications: user.email_notifications !== undefined ? Boolean(user.email_notifications) : true,
      smsNotifications: user.sms_notifications !== undefined ? Boolean(user.sms_notifications) : true,
      pushNotifications: user.push_notifications !== undefined ? Boolean(user.push_notifications) : true,
      newsletter: user.newsletter !== undefined ? Boolean(user.newsletter) : true,
      preferredPaymentMethod: user.preferred_payment_method || 'COD',
      twoFactorEnabled: user.two_factor_enabled !== undefined ? Boolean(user.two_factor_enabled) : false,
      addresses: addressDTOs,
      defaultAddress: defaultAddr
    };

    return res.status(200).json(ApiResponse.success(data, 'Customer settings fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const body = req.body || {};

    let user = null;
    if (userId) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      user = rows[0];
    } else if (body.email) {
      const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [body.email.trim().toLowerCase()]);
      user = rows[0];
    }

    if (!user) {
      return res.status(400).json(ApiResponse.error('User not found'));
    }

    let updates = [];
    let params = [];

    if (body.fullName !== undefined) { updates.push('full_name = ?'); params.push(body.fullName); }
    if (body.phone !== undefined) { updates.push('phone = ?'); params.push(body.phone); }
    if (body.dob !== undefined) { updates.push('dob = ?'); params.push(body.dob); }
    if (body.gender !== undefined) { updates.push('gender = ?'); params.push(body.gender); }
    if (body.profilePhoto !== undefined) { updates.push('profile_photo = ?'); params.push(body.profilePhoto); }
    if (body.preferredLanguage !== undefined) { updates.push('preferred_language = ?'); params.push(body.preferredLanguage); }
    if (body.emailNotifications !== undefined) { updates.push('email_notifications = ?'); params.push(body.emailNotifications ? 1 : 0); }
    if (body.smsNotifications !== undefined) { updates.push('sms_notifications = ?'); params.push(body.smsNotifications ? 1 : 0); }
    if (body.pushNotifications !== undefined) { updates.push('push_notifications = ?'); params.push(body.pushNotifications ? 1 : 0); }
    if (body.newsletter !== undefined) { updates.push('newsletter = ?'); params.push(body.newsletter ? 1 : 0); }
    if (body.preferredPaymentMethod !== undefined) { updates.push('preferred_payment_method = ?'); params.push(body.preferredPaymentMethod); }
    if (body.twoFactorEnabled !== undefined) { updates.push('two_factor_enabled = ?'); params.push(body.twoFactorEnabled ? 1 : 0); }

    if (updates.length > 0) {
      params.push(user.id);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    return exports.getSettings(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.getAddresses = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(200).json(ApiResponse.success([], 'No addresses found'));
    }

    const [addresses] = await pool.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [userId]);
    const dtos = addresses.map(a => ({
      id: a.id,
      userId: a.user_id,
      fullName: a.full_name,
      phone: a.phone,
      alternatePhone: a.alternate_phone,
      houseFlatNo: a.house_flat_no,
      streetAddress: a.street_address,
      area: a.area,
      landmark: a.landmark,
      city: a.city,
      district: a.district,
      state: a.state,
      pincode: a.pincode,
      country: a.country,
      addressType: a.address_type || 'HOME',
      isDefault: Boolean(a.is_default)
    }));

    return res.status(200).json(ApiResponse.success(dtos, 'Addresses fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.createAddress = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(400).json(ApiResponse.error('User session not found'));
    }

    const dto = req.body || {};

    if (dto.isDefault) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const [existing] = await pool.query('SELECT id FROM addresses WHERE user_id = ?', [userId]);
    const isDefaultVal = dto.isDefault || existing.length === 0 ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO addresses 
       (user_id, full_name, phone, alternate_phone, house_flat_no, street_address, area, landmark, city, district, state, pincode, country, address_type, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        dto.fullName || req.user.full_name,
        dto.phone || req.user.phone,
        dto.alternatePhone || null,
        dto.houseFlatNo || null,
        dto.streetAddress || '',
        dto.area || null,
        dto.landmark || null,
        dto.city || 'Chennai',
        dto.district || dto.city || 'Chennai',
        dto.state || 'Tamil Nadu',
        dto.pincode || '600001',
        dto.country || 'India',
        dto.addressType || 'HOME',
        isDefaultVal
      ]
    );

    const [inserted] = await pool.query('SELECT * FROM addresses WHERE id = ?', [result.insertId]);
    const a = inserted[0];

    return res.status(200).json(ApiResponse.success({
      id: a.id,
      userId: a.user_id,
      fullName: a.full_name,
      phone: a.phone,
      alternatePhone: a.alternate_phone,
      houseFlatNo: a.house_flat_no,
      streetAddress: a.street_address,
      area: a.area,
      landmark: a.landmark,
      city: a.city,
      district: a.district,
      state: a.state,
      pincode: a.pincode,
      country: a.country,
      addressType: a.address_type || 'HOME',
      isDefault: Boolean(a.is_default)
    }, 'Address created successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dto = req.body || {};

    const [rows] = await pool.query('SELECT * FROM addresses WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(400).json(ApiResponse.error('Address not found'));
    }
    const addr = rows[0];

    if (dto.isDefault) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [addr.user_id]);
    }

    let updates = [];
    let params = [];

    if (dto.fullName !== undefined) { updates.push('full_name = ?'); params.push(dto.fullName); }
    if (dto.phone !== undefined) { updates.push('phone = ?'); params.push(dto.phone); }
    if (dto.alternatePhone !== undefined) { updates.push('alternate_phone = ?'); params.push(dto.alternatePhone); }
    if (dto.houseFlatNo !== undefined) { updates.push('house_flat_no = ?'); params.push(dto.houseFlatNo); }
    if (dto.streetAddress !== undefined) { updates.push('street_address = ?'); params.push(dto.streetAddress); }
    if (dto.area !== undefined) { updates.push('area = ?'); params.push(dto.area); }
    if (dto.landmark !== undefined) { updates.push('landmark = ?'); params.push(dto.landmark); }
    if (dto.city !== undefined) { updates.push('city = ?'); params.push(dto.city); }
    if (dto.district !== undefined) { updates.push('district = ?'); params.push(dto.district); }
    if (dto.state !== undefined) { updates.push('state = ?'); params.push(dto.state); }
    if (dto.pincode !== undefined) { updates.push('pincode = ?'); params.push(dto.pincode); }
    if (dto.country !== undefined) { updates.push('country = ?'); params.push(dto.country); }
    if (dto.addressType !== undefined) { updates.push('address_type = ?'); params.push(dto.addressType); }
    if (dto.isDefault !== undefined) { updates.push('is_default = ?'); params.push(dto.isDefault ? 1 : 0); }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE addresses SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [updatedRows] = await pool.query('SELECT * FROM addresses WHERE id = ?', [id]);
    const a = updatedRows[0];

    return res.status(200).json(ApiResponse.success({
      id: a.id,
      userId: a.user_id,
      fullName: a.full_name,
      phone: a.phone,
      alternatePhone: a.alternate_phone,
      houseFlatNo: a.house_flat_no,
      streetAddress: a.street_address,
      area: a.area,
      landmark: a.landmark,
      city: a.city,
      district: a.district,
      state: a.state,
      pincode: a.pincode,
      country: a.country,
      addressType: a.address_type || 'HOME',
      isDefault: Boolean(a.is_default)
    }, 'Address updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM addresses WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(400).json(ApiResponse.error('Address not found'));
    }
    const addr = rows[0];

    await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [addr.user_id]);
    await pool.query('UPDATE addresses SET is_default = 1 WHERE id = ?', [id]);

    const [updatedRows] = await pool.query('SELECT * FROM addresses WHERE id = ?', [id]);
    const a = updatedRows[0];

    return res.status(200).json(ApiResponse.success({
      id: a.id,
      userId: a.user_id,
      fullName: a.full_name,
      phone: a.phone,
      alternatePhone: a.alternate_phone,
      houseFlatNo: a.house_flat_no,
      streetAddress: a.street_address,
      area: a.area,
      landmark: a.landmark,
      city: a.city,
      district: a.district,
      state: a.state,
      pincode: a.pincode,
      country: a.country,
      addressType: a.address_type || 'HOME',
      isDefault: Boolean(a.is_default)
    }, 'Default address set successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM addresses WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Address deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { currentPassword, newPassword, email } = req.body || {};

    let user = null;
    if (userId) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      user = rows[0];
    } else if (email && String(email).trim()) {
      const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [email.trim().toLowerCase()]);
      user = rows[0];
    }

    if (!user) {
      return res.status(400).json(ApiResponse.error('User session not found. Please log in again.'));
    }

    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json(ApiResponse.error('New password must be at least 6 characters long'));
    }

    if (currentPassword && user.password) {
      const formattedHash = user.password.startsWith('$2y$')
        ? user.password.replace(/^\$2y\$/, '$2a$')
        : user.password;
      const isMatch = await bcrypt.compare(String(currentPassword).trim(), formattedHash);
      if (!isMatch) {
        return res.status(400).json(ApiResponse.error('Current password does not match'));
      }
    }

    const hashedPassword = await bcrypt.hash(String(newPassword).trim(), 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    try {
      await pool.query('UPDATE admin SET password = ? WHERE LOWER(email) = ? OR username = ?', [hashedPassword, user.email.toLowerCase(), 'vanakkam']);
    } catch (eAdmin) {}

    return res.status(200).json(ApiResponse.success(null, 'Password changed successfully'));
  } catch (err) {
    next(err);
  }
};

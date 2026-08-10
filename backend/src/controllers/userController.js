const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json(ApiResponse.error('User not found'));
    }
    const user = users[0];
    const profile = {
      id: user.id,
      fullName: user.full_name || user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      googleId: user.google_id,
      roles: req.user.roles || ['ROLE_USER']
    };
    return res.status(200).json(ApiResponse.success(profile, 'Profile fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, phone, address } = req.body;

    let updates = [];
    let params = [];

    if (fullName !== undefined) {
      updates.push('full_name = ?');
      params.push(fullName);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }

    if (updates.length > 0) {
      params.push(userId);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    const profile = {
      id: user.id,
      fullName: user.full_name || user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      googleId: user.google_id,
      roles: req.user.roles || ['ROLE_USER']
    };

    return res.status(200).json(ApiResponse.success(profile, 'Profile updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [addresses] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
      [userId]
    );

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

exports.addAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      fullName, phone, alternatePhone, houseFlatNo, streetAddress,
      area, landmark, city, district, state, pincode, country, addressType, isDefault
    } = req.body;

    if (isDefault) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }

    const [existing] = await pool.query('SELECT id FROM addresses WHERE user_id = ?', [userId]);
    const makeDefault = isDefault || existing.length === 0 ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO addresses 
       (user_id, full_name, phone, alternate_phone, house_flat_no, street_address, area, landmark, city, district, state, pincode, country, address_type, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        fullName || req.user.full_name,
        phone || req.user.phone,
        alternatePhone || null,
        houseFlatNo || null,
        streetAddress || '',
        area || null,
        landmark || null,
        city || 'Chennai',
        district || city || 'Chennai',
        state || 'Tamil Nadu',
        pincode || '600001',
        country || 'India',
        addressType || 'HOME',
        makeDefault
      ]
    );

    const [inserted] = await pool.query('SELECT * FROM addresses WHERE id = ?', [result.insertId]);
    const a = inserted[0];
    const dto = {
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
    };

    return res.status(200).json(ApiResponse.success(dto, 'Address created successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
    return res.status(200).json(ApiResponse.success(null, 'Address deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      return res.status(400).json(ApiResponse.error('Role is required'));
    }
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role.toLowerCase(), id]);
    return res.status(200).json(ApiResponse.success(null, 'User role updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (String(id) === String(req.user.id)) {
      return res.status(400).json(ApiResponse.error('You cannot delete your own admin account'));
    }
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'User deleted successfully'));
  } catch (err) {
    next(err);
  }
};

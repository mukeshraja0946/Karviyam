const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.checkPincode = async (req, res, next) => {
  try {
    const { pincode } = req.params;
    if (!pincode) {
      return res.status(400).json(ApiResponse.error('Pincode is required'));
    }

    const cleanPin = pincode.trim();
    const [rows] = await pool.query(
      `SELECT * FROM deliverable_locations 
       WHERE pincode = ? AND (is_active = 1 OR is_active IS NULL)`,
      [cleanPin]
    );

    if (rows.length === 0) {
      return res.status(200).json(ApiResponse.success({
        deliverable: false,
        pincode: cleanPin,
        message: 'Delivery is currently not available for this pincode.'
      }, 'Pincode check completed'));
    }

    const loc = rows[0];
    return res.status(200).json(ApiResponse.success({
      deliverable: true,
      pincode: loc.pincode,
      city: loc.city,
      state: loc.state,
      estimatedDeliveryDays: loc.estimated_delivery_days || '3-5 Days',
      isCodAvailable: loc.is_cod_available !== undefined ? Boolean(loc.is_cod_available) : true,
      message: 'Delivery is available for this location!'
    }, 'Pincode deliverable'));
  } catch (err) {
    next(err);
  }
};

exports.getAllPincodes = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM deliverable_locations ORDER BY id DESC');
    const list = rows.map(l => ({
      id: l.id,
      pincode: l.pincode,
      city: l.city,
      state: l.state,
      estimatedDeliveryDays: l.estimated_delivery_days,
      isCodAvailable: Boolean(l.is_cod_available),
      isActive: Boolean(l.is_active)
    }));
    return res.status(200).json(ApiResponse.success(list, 'Pincodes fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.createPincode = async (req, res, next) => {
  try {
    const { pincode, city, area, district, state, estimatedDeliveryDays, isCodAvailable, isDeliveryAvailable, isActive } = req.body;
    if (!pincode) {
      return res.status(400).json(ApiResponse.error('Pincode is required'));
    }

    const resolvedCity = city || area || district || 'General Region';
    const resolvedState = state || 'Tamil Nadu';

    const [result] = await pool.query(
      `INSERT INTO deliverable_locations 
       (pincode, city, state, estimated_delivery_days, is_cod_available, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        pincode.trim(), resolvedCity, resolvedState,
        estimatedDeliveryDays || '3-5 Days',
        isCodAvailable !== false ? 1 : 0,
        isActive !== false ? 1 : 0
      ]
    );

    const [rows] = await pool.query('SELECT * FROM deliverable_locations WHERE id = ?', [result.insertId]);
    return res.status(200).json(ApiResponse.success(rows[0], 'Pincode location added successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updatePincode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pincode, city, state, estimatedDeliveryDays, isCodAvailable, isActive } = req.body;

    let updates = [];
    let params = [];

    if (pincode !== undefined) { updates.push('pincode = ?'); params.push(pincode.trim()); }
    if (city !== undefined) { updates.push('city = ?'); params.push(city); }
    if (state !== undefined) { updates.push('state = ?'); params.push(state); }
    if (estimatedDeliveryDays !== undefined) { updates.push('estimated_delivery_days = ?'); params.push(estimatedDeliveryDays); }
    if (isCodAvailable !== undefined) { updates.push('is_cod_available = ?'); params.push(isCodAvailable ? 1 : 0); }
    if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(`UPDATE deliverable_locations SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [rows] = await pool.query('SELECT * FROM deliverable_locations WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(rows[0], 'Pincode location updated successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deletePincode = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM deliverable_locations WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(null, 'Pincode location deleted successfully'));
  } catch (err) {
    next(err);
  }
};

exports.togglePincodeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT is_active FROM deliverable_locations WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json(ApiResponse.error('Pincode not found'));
    }

    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.query('UPDATE deliverable_locations SET is_active = ? WHERE id = ?', [newStatus, id]);

    const [updated] = await pool.query('SELECT * FROM deliverable_locations WHERE id = ?', [id]);
    return res.status(200).json(ApiResponse.success(updated[0], 'Pincode status updated'));
  } catch (err) {
    next(err);
  }
};

exports.bulkImportPincodes = async (req, res, next) => {
  try {
    const dtos = Array.isArray(req.body) ? req.body : (req.body.pincodes || []);
    let count = 0;
    for (const item of dtos) {
      if (item.pincode && item.city) {
        await pool.query(
          `INSERT INTO deliverable_locations (pincode, city, state, estimated_delivery_days, is_cod_available, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, 1, NOW())
           ON DUPLICATE KEY UPDATE city = VALUES(city), state = VALUES(state)`,
          [item.pincode.toString().trim(), item.city, item.state || 'Tamil Nadu', item.estimatedDeliveryDays || '3-5 Days', item.isCodAvailable !== false ? 1 : 0]
        );
        count++;
      }
    }
    return res.status(200).json(ApiResponse.success({ importedCount: count }, 'Pincodes bulk imported successfully'));
  } catch (err) {
    next(err);
  }
};

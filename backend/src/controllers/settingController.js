const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.getSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settingsObj = {};

    rows.forEach(r => {
      let val = r.setting_value;
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      settingsObj[r.setting_key] = val;
    });

    // Merge company settings if company_settings table exists
    try {
      const [compRows] = await pool.query('SELECT * FROM company_settings LIMIT 1');
      if (compRows.length > 0) {
        const c = compRows[0];
        settingsObj.companyDisplayName = c.company_display_name || c.company_name;
        settingsObj.legalCompanyName = c.legal_company_name || c.company_name;
        settingsObj.gstNumber = c.gst_number;
        settingsObj.panNumber = c.pan_number;
        settingsObj.cinNumber = c.cin_number;
        settingsObj.state = c.state;
        settingsObj.stateCode = c.state_code;
        settingsObj.registeredAddress = c.registered_address || c.company_address;
        settingsObj.warehouseAddress = c.warehouse_address;
        settingsObj.supportEmail = c.support_email;
        settingsObj.supportPhone = c.support_phone;
        settingsObj.website = c.website;
        settingsObj.authorizedSignatory = c.authorized_signatory;
        settingsObj.designation = c.designation;
      }
    } catch (e) {}

    return res.status(200).json(ApiResponse.success(settingsObj, 'Settings retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const settingsData = req.body || {};

    if (settingsData.maintenanceMode !== undefined) {
      settingsData.maintenance_mode = String(settingsData.maintenanceMode);
    }

    for (const [key, value] of Object.entries(settingsData)) {
      if (value !== undefined && value !== null) {
        const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await pool.query(
          `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [key, strVal]
        );
      }
    }

    return exports.getSettings(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.getCompanySettings = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM company_settings LIMIT 1');
    if (rows.length === 0) {
      return res.status(200).json(ApiResponse.success({}, 'Company settings empty'));
    }
    const c = rows[0];
    return res.status(200).json(ApiResponse.success({
      companyDisplayName: c.company_display_name || c.company_name || '',
      legalCompanyName: c.legal_company_name || c.company_name || '',
      gstNumber: c.gst_number || '',
      panNumber: c.pan_number || '',
      cinNumber: c.cin_number || '',
      state: c.state || '',
      stateCode: c.state_code || '',
      registeredAddress: c.registered_address || c.company_address || '',
      warehouseAddress: c.warehouse_address || '',
      supportEmail: c.support_email || '',
      supportPhone: c.support_phone || '',
      website: c.website || '',
      authorizedSignatory: c.authorized_signatory || '',
      designation: c.designation || ''
    }, 'Company settings retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateCompanySettings = async (req, res, next) => {
  try {
    const body = req.body || {};
    const companyDisplayName = body.companyDisplayName || body.companyName || '';
    const legalCompanyName = body.legalCompanyName || body.companyName || '';
    const gstNumber = body.gstNumber || body.gstNo || '';
    const panNumber = body.panNumber || body.panNo || '';
    const cinNumber = body.cinNumber || body.cinNo || '';
    const state = body.state || '';
    const stateCode = body.stateCode || '';
    const registeredAddress = body.registeredAddress || body.address || body.companyAddress || '';
    const warehouseAddress = body.warehouseAddress || '';
    const supportEmail = body.supportEmail || '';
    const supportPhone = body.supportPhone || '';
    const website = body.website || '';
    const authorizedSignatory = body.authorizedSignatory || body.signatoryName || '';
    const designation = body.designation || body.signatoryDesignation || '';

    const [rows] = await pool.query('SELECT id FROM company_settings LIMIT 1');
    if (rows.length > 0) {
      await pool.query(
        `UPDATE company_settings SET 
         company_display_name = ?, legal_company_name = ?, gst_number = ?, pan_number = ?, cin_number = ?,
         state = ?, state_code = ?, registered_address = ?, warehouse_address = ?, support_email = ?, support_phone = ?,
         website = ?, authorized_signatory = ?, designation = ?
         WHERE id = ?`,
        [companyDisplayName, legalCompanyName, gstNumber, panNumber, cinNumber, state, stateCode, registeredAddress, warehouseAddress, supportEmail, supportPhone, website, authorizedSignatory, designation, rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO company_settings 
         (company_display_name, legal_company_name, gst_number, pan_number, cin_number, state, state_code, registered_address, warehouse_address, support_email, support_phone, website, authorized_signatory, designation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [companyDisplayName, legalCompanyName, gstNumber, panNumber, cinNumber, state, stateCode, registeredAddress, warehouseAddress, supportEmail, supportPhone, website, authorizedSignatory, designation]
      );
    }

    return exports.getCompanySettings(req, res, next);
  } catch (err) {
    next(err);
  }
};

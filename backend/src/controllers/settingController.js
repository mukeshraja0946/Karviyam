const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

const ensureSettingsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {}
};

exports.getSettings = async (req, res, next) => {
  try {
    await ensureSettingsTable();
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

    const cnVal = settingsObj.categoryNavigationEnabled !== undefined 
      ? settingsObj.categoryNavigationEnabled 
      : settingsObj.category_navigation_enabled;
    const isCatNavEnabled = cnVal === undefined ? true : (cnVal === true || cnVal === 'true' || cnVal === 1 || cnVal === '1');
    settingsObj.categoryNavigationEnabled = isCatNavEnabled;
    settingsObj.category_navigation_enabled = isCatNavEnabled;

    return res.status(200).json(ApiResponse.success(settingsObj, 'Settings retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.getPaymentSettings = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settingsObj = {};

    rows.forEach(r => {
      let val = r.setting_value;
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      settingsObj[r.setting_key] = val;
    });

    const cod = settingsObj.codEnabled !== false && settingsObj.codEnabled !== 'false';
    const online = settingsObj.onlinePaymentEnabled !== false && settingsObj.onlinePaymentEnabled !== 'false';
    const rzp = online && settingsObj.razorpayEnabled !== false && settingsObj.razorpayEnabled !== 'false';
    const stp = online && settingsObj.stripeEnabled !== false && settingsObj.stripeEnabled !== 'false';
    const def = settingsObj.defaultPaymentMethod || (cod ? 'COD' : (rzp ? 'Razorpay' : (stp ? 'Stripe' : 'COD')));

    const data = {
      cod_enabled: cod,
      online_payment_enabled: online,
      razorpay_enabled: rzp,
      stripe_enabled: stp,
      default_payment_method: def,

      codEnabled: cod,
      onlinePaymentEnabled: online,
      razorpayEnabled: rzp,
      stripeEnabled: stp,
      defaultPaymentMethod: def
    };

    return res.status(200).json(ApiResponse.success(data, 'Payment settings retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updatePaymentSettings = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    const body = req.body || {};

    const codVal = body.codEnabled !== undefined ? body.codEnabled : body.cod_enabled;
    const onlineVal = body.onlinePaymentEnabled !== undefined ? body.onlinePaymentEnabled : body.online_payment_enabled;
    const rzpVal = body.razorpayEnabled !== undefined ? body.razorpayEnabled : body.razorpay_enabled;
    const stpVal = body.stripeEnabled !== undefined ? body.stripeEnabled : body.stripe_enabled;
    const defVal = body.defaultPaymentMethod !== undefined ? body.defaultPaymentMethod : body.default_payment_method;

    const updates = {};
    if (codVal !== undefined) updates['codEnabled'] = String(codVal);
    if (onlineVal !== undefined) updates['onlinePaymentEnabled'] = String(onlineVal);
    if (rzpVal !== undefined) updates['razorpayEnabled'] = String(rzpVal);
    if (stpVal !== undefined) updates['stripeEnabled'] = String(stpVal);
    if (defVal !== undefined) updates['defaultPaymentMethod'] = String(defVal);

    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value]
      );
    }

    return exports.getPaymentSettings(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    await ensureSettingsTable();
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

exports.getFooterSettings = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settingsObj = {};

    rows.forEach(r => {
      let val = r.setting_value;
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      settingsObj[r.setting_key] = val;
    });

    try {
      const [compRows] = await pool.query('SELECT * FROM company_settings LIMIT 1');
      if (compRows.length > 0) {
        const c = compRows[0];
        if (c.registered_address) settingsObj.address = c.registered_address;
        if (c.support_email) settingsObj.email = c.support_email;
        if (c.support_phone) settingsObj.phone = c.support_phone;
      }
    } catch (e) {}

    const footerConfig = {
      about: settingsObj.footerAbout || settingsObj.about || 'Karviyam is a premium marketplace destination for high-street streetwear, 925 sterling silver jewellery, luxury kicks, and lifestyle products.',
      address: settingsObj.registeredAddress || settingsObj.address || 'Karviyam Tower, Park Avenue, Chennai, Tamil Nadu 600001',
      phone: settingsObj.supportPhone || settingsObj.phone || '+91 98765 43210',
      email: settingsObj.supportEmail || settingsObj.email || 'vanakkam@karviyam.com',
      logoUrl: settingsObj.logoUrl || settingsObj.logo || '',
      copyright: settingsObj.copyrightText || '© 2026 Karviyam E-Commerce Platform. All Rights Reserved. Built for Enterprise Performance.',
      b1Title: settingsObj.badge1Title || 'Free Delivery',
      b1Sub: settingsObj.badge1Sub || 'On orders above ₹499',
      b2Title: settingsObj.badge2Title || 'Easy Returns',
      b2Sub: settingsObj.badge2Sub || '30 days return policy',
      b3Title: settingsObj.badge3Title || 'Secure Payments',
      b3Sub: settingsObj.badge3Sub || '100% secure checkout',
      b4Title: settingsObj.badge4Title || 'Best Price Guarantee',
      b4Sub: settingsObj.badge4Sub || 'Unmatched value',
      b5Title: settingsObj.badge5Title || '24/7 Support',
      b5Sub: settingsObj.badge5Sub || 'Dedicated assistance',
    };

    return res.status(200).json(ApiResponse.success(footerConfig, 'Footer settings retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

exports.updateFooterSettings = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    const data = req.body || {};

    const updates = {};
    if (data.about !== undefined) updates['footerAbout'] = String(data.about);
    if (data.footerAbout !== undefined) updates['footerAbout'] = String(data.footerAbout);
    if (data.address !== undefined) updates['address'] = String(data.address);
    if (data.phone !== undefined) updates['supportPhone'] = String(data.phone);
    if (data.supportPhone !== undefined) updates['supportPhone'] = String(data.supportPhone);
    if (data.email !== undefined) updates['supportEmail'] = String(data.email);
    if (data.supportEmail !== undefined) updates['supportEmail'] = String(data.supportEmail);
    if (data.logoUrl !== undefined) updates['logoUrl'] = String(data.logoUrl);
    if (data.copyright !== undefined) updates['copyrightText'] = String(data.copyright);
    if (data.b1Title !== undefined) updates['badge1Title'] = String(data.b1Title);
    if (data.b1Sub !== undefined) updates['badge1Sub'] = String(data.b1Sub);
    if (data.b2Title !== undefined) updates['badge2Title'] = String(data.b2Title);
    if (data.b2Sub !== undefined) updates['badge2Sub'] = String(data.b2Sub);
    if (data.b3Title !== undefined) updates['badge3Title'] = String(data.b3Title);
    if (data.b3Sub !== undefined) updates['badge3Sub'] = String(data.b3Sub);
    if (data.b4Title !== undefined) updates['badge4Title'] = String(data.b4Title);
    if (data.b4Sub !== undefined) updates['badge4Sub'] = String(data.b4Sub);
    if (data.b5Title !== undefined) updates['badge5Title'] = String(data.b5Title);
    if (data.b5Sub !== undefined) updates['badge5Sub'] = String(data.b5Sub);

    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value]
      );
    }

    return exports.getFooterSettings(req, res, next);
  } catch (err) {
    next(err);
  }
};


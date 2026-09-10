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

const ensureCompanySettingsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        company_display_name VARCHAR(255),
        legal_company_name VARCHAR(255),
        gst_number VARCHAR(50),
        pan_number VARCHAR(50),
        cin_number VARCHAR(50),
        state VARCHAR(100),
        state_code VARCHAR(20),
        registered_address TEXT,
        warehouse_address TEXT,
        support_email VARCHAR(150),
        support_phone VARCHAR(50),
        website VARCHAR(255),
        authorized_signatory VARCHAR(150),
        designation VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {}
};

exports.getSettings = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    let rows = [];
    try {
      const [r] = await pool.query('SELECT setting_key, setting_value FROM settings');
      rows = r || [];
    } catch (eDb) {}

    const settingsObj = {};

    rows.forEach(r => {
      let val = r.setting_value;
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
        try {
          val = JSON.parse(val);
        } catch (e) {}
      }
      settingsObj[r.setting_key] = val;
    });

    // Merge company settings if company_settings table exists
    try {
      await ensureCompanySettingsTable();
      const [compRows] = await pool.query('SELECT * FROM company_settings LIMIT 1');
      if (compRows && compRows.length > 0) {
        const c = compRows[0];
        settingsObj.companyDisplayName = c.company_display_name || c.company_name || '';
        settingsObj.legalCompanyName = c.legal_company_name || c.company_name || '';
        settingsObj.gstNumber = c.gst_number || '';
        settingsObj.panNumber = c.pan_number || '';
        settingsObj.cinNumber = c.cin_number || '';
        settingsObj.state = c.state || '';
        settingsObj.stateCode = c.state_code || '';
        settingsObj.registeredAddress = c.registered_address || c.company_address || '';
        settingsObj.warehouseAddress = c.warehouse_address || '';
        settingsObj.supportEmail = c.support_email || '';
        settingsObj.supportPhone = c.support_phone || '';
        settingsObj.website = c.website || '';
        settingsObj.authorizedSignatory = c.authorized_signatory || '';
        settingsObj.designation = c.designation || '';
      }
    } catch (e) {}

    const cnVal = settingsObj.categoryNavigationEnabled !== undefined 
      ? settingsObj.categoryNavigationEnabled 
      : settingsObj.category_navigation_enabled;
    const isCatNavEnabled = cnVal === undefined ? true : (cnVal === true || cnVal === 'true' || cnVal === 1 || cnVal === '1');
    settingsObj.categoryNavigationEnabled = isCatNavEnabled;
    settingsObj.category_navigation_enabled = isCatNavEnabled;

    const pAutoChangeVal = settingsObj.productImageAutoChange !== undefined
      ? settingsObj.productImageAutoChange
      : settingsObj.product_image_auto_change;
    const isPAutoChange = pAutoChangeVal === true || pAutoChangeVal === 'true' || pAutoChangeVal === 1 || pAutoChangeVal === '1';
    settingsObj.productImageAutoChange = isPAutoChange;
    settingsObj.product_image_auto_change = isPAutoChange;

    const rawPInterval = settingsObj.productImageChangeInterval || settingsObj.product_image_change_interval;
    const parsedPInterval = rawPInterval ? parseInt(rawPInterval, 10) : 3;
    const finalPInterval = isNaN(parsedPInterval) || parsedPInterval <= 0 ? 3 : parsedPInterval;
    settingsObj.productImageChangeInterval = finalPInterval;
    settingsObj.product_image_change_interval = finalPInterval;

    return res.status(200).json(ApiResponse.success(settingsObj, 'Settings retrieved successfully'));
  } catch (err) {
    console.error('[getSettings Fallback Catch]:', err);
    return res.status(200).json(ApiResponse.success({}, 'Settings fallback retrieved'));
  }
};

const ensurePaymentSettingsColumns = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        razorpay_key_id VARCHAR(255),
        razorpay_secret_key VARCHAR(255),
        bank_name VARCHAR(255),
        account_number VARCHAR(255),
        ifsc_code VARCHAR(100),
        upi_id VARCHAR(255) DEFAULT 'karviyam@hdfcbank',
        enable_cod TINYINT(1) DEFAULT 1,
        enable_upi TINYINT(1) DEFAULT 1,
        enable_nb TINYINT(1) DEFAULT 1,
        enable_razorpay TINYINT(1) DEFAULT 1,
        enable_upi_qr TINYINT(1) DEFAULT 1,
        qr_image_url VARCHAR(500) DEFAULT '',
        qr_display_name VARCHAR(255) DEFAULT 'Karviyam',
        qr_instructions TEXT,
        verification_mode VARCHAR(50) DEFAULT 'Razorpay',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    const alters = [
      "ALTER TABLE payment_settings ADD COLUMN enable_razorpay TINYINT(1) DEFAULT 1",
      "ALTER TABLE payment_settings ADD COLUMN enable_upi_qr TINYINT(1) DEFAULT 1",
      "ALTER TABLE payment_settings ADD COLUMN qr_image_url VARCHAR(500) DEFAULT ''",
      "ALTER TABLE payment_settings ADD COLUMN qr_display_name VARCHAR(255) DEFAULT 'Karviyam'",
      "ALTER TABLE payment_settings ADD COLUMN qr_instructions TEXT",
      "ALTER TABLE payment_settings ADD COLUMN verification_mode VARCHAR(50) DEFAULT 'Razorpay'"
    ];
    for (const q of alters) {
      try { await pool.query(q); } catch (e) {}
    }
  } catch (e) {}
};

exports.getPaymentSettings = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    await ensurePaymentSettingsColumns();

    let dbPayRow = {};
    try {
      const [pRows] = await pool.query('SELECT * FROM payment_settings ORDER BY id ASC LIMIT 1');
      if (pRows.length > 0) dbPayRow = pRows[0];
    } catch (e) {}

    let rows = [];
    try {
      const [r] = await pool.query('SELECT setting_key, setting_value FROM settings');
      rows = r || [];
    } catch (eDb) {}

    const settingsObj = {};
    rows.forEach(r => {
      let val = r.setting_value;
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      settingsObj[r.setting_key] = val;
    });

    const checkB = (val, defaultVal = true) => {
      if (val === undefined || val === null) return defaultVal;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') return val === 1;
      if (typeof val === 'string') {
        const l = val.trim().toLowerCase();
        if (l === 'true' || l === '1') return true;
        if (l === 'false' || l === '0') return false;
      }
      return defaultVal;
    };

    const cod = checkB(dbPayRow.enable_cod !== undefined ? dbPayRow.enable_cod : settingsObj.codEnabled, true);
    const rzp = checkB(dbPayRow.enable_razorpay !== undefined ? dbPayRow.enable_razorpay : (settingsObj.razorpayEnabled !== undefined ? settingsObj.razorpayEnabled : settingsObj.onlinePaymentEnabled), true);
    const upiQr = checkB(dbPayRow.enable_upi_qr !== undefined ? dbPayRow.enable_upi_qr : settingsObj.upiQrEnabled, true);

    const upiId = dbPayRow.upi_id || settingsObj.upiId || 'karviyam@hdfcbank';
    const qrImageUrl = dbPayRow.qr_image_url || settingsObj.qrImageUrl || '';
    const qrDisplayName = dbPayRow.qr_display_name || settingsObj.qrDisplayName || 'Karviyam';
    const qrInstructions = dbPayRow.qr_instructions || settingsObj.qrInstructions || 'Scan this QR using GPay, PhonePe, Paytm or any supported UPI app';
    const verificationMode = dbPayRow.verification_mode || settingsObj.verificationMode || 'Razorpay';

    const data = {
      codEnabled: cod,
      razorpayEnabled: rzp,
      upiQrEnabled: upiQr,
      upiId,
      qrImageUrl,
      qrDisplayName,
      qrInstructions,
      verificationMode,

      // Compatibility fields
      cod_enabled: cod,
      razorpay_enabled: rzp,
      upi_qr_enabled: upiQr,
      upi_id: upiId,
      qr_image_url: qrImageUrl,
      qr_display_name: qrDisplayName,
      qr_instructions: qrInstructions,
      verification_mode: verificationMode,
      onlinePaymentEnabled: rzp,
      online_payment_enabled: rzp,
      defaultPaymentMethod: cod ? 'COD' : (rzp ? 'UPI' : 'UPI_QR')
    };

    return res.status(200).json(ApiResponse.success(data, 'Payment settings retrieved successfully'));
  } catch (err) {
    console.error('[getPaymentSettings Error]:', err);
    return res.status(200).json(ApiResponse.success({
      codEnabled: true,
      razorpayEnabled: true,
      upiQrEnabled: true,
      upiId: 'karviyam@hdfcbank',
      qrImageUrl: '',
      qrDisplayName: 'Karviyam',
      qrInstructions: 'Scan this QR using GPay, PhonePe, Paytm or any supported UPI app',
      verificationMode: 'Razorpay'
    }, 'Payment settings fallback retrieved'));
  }
};

exports.updatePaymentSettings = async (req, res, next) => {
  try {
    await ensureSettingsTable();
    await ensurePaymentSettingsColumns();

    const body = req.body || {};

    const codVal = body.codEnabled !== undefined ? body.codEnabled : body.cod_enabled;
    const rzpVal = body.razorpayEnabled !== undefined ? body.razorpayEnabled : body.razorpay_enabled;
    const qrVal = body.upiQrEnabled !== undefined ? body.upiQrEnabled : body.upi_qr_enabled;

    const upiId = body.upiId !== undefined ? body.upiId : body.upi_id;
    const qrImageUrl = body.qrImageUrl !== undefined ? body.qrImageUrl : body.qr_image_url;
    const qrDisplayName = body.qrDisplayName !== undefined ? body.qrDisplayName : body.qr_display_name;
    const qrInstructions = body.qrInstructions !== undefined ? body.qrInstructions : body.qr_instructions;
    const verificationMode = body.verificationMode !== undefined ? body.verificationMode : body.verification_mode;

    const checkBNum = (v, defaultVal = 1) => {
      if (v === undefined || v === null) return defaultVal;
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (typeof v === 'string') return (v === 'true' || v === '1') ? 1 : 0;
      return v ? 1 : 0;
    };

    const codBool = checkBNum(codVal, 1);
    const rzpBool = checkBNum(rzpVal, 1);
    const qrBool = checkBNum(qrVal, 1);

    const [existing] = await pool.query('SELECT id FROM payment_settings ORDER BY id ASC LIMIT 1');
    if (existing.length > 0) {
      await pool.query(
        `UPDATE payment_settings 
         SET enable_cod = ?, enable_razorpay = ?, enable_upi_qr = ?, 
             upi_id = ?, qr_image_url = ?, qr_display_name = ?, qr_instructions = ?, verification_mode = ?, updated_at = NOW()
         WHERE id = ?`,
        [codBool, rzpBool, qrBool, upiId || 'karviyam@hdfcbank', qrImageUrl || '', qrDisplayName || 'Karviyam', qrInstructions || '', verificationMode || 'Razorpay', existing[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO payment_settings (enable_cod, enable_razorpay, enable_upi_qr, upi_id, qr_image_url, qr_display_name, qr_instructions, verification_mode, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [codBool, rzpBool, qrBool, upiId || 'karviyam@hdfcbank', qrImageUrl || '', qrDisplayName || 'Karviyam', qrInstructions || '', verificationMode || 'Razorpay']
      );
    }

    // Key-value dual persistence
    const updates = {
      codEnabled: String(Boolean(codBool)),
      razorpayEnabled: String(Boolean(rzpBool)),
      upiQrEnabled: String(Boolean(qrBool)),
      onlinePaymentEnabled: String(Boolean(rzpBool)),
      upiId: upiId || 'karviyam@hdfcbank',
      qrImageUrl: qrImageUrl || '',
      qrDisplayName: qrDisplayName || 'Karviyam',
      qrInstructions: qrInstructions || '',
      verificationMode: verificationMode || 'Razorpay'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await pool.query(
          `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [key, value]
        );
      }
    }

    return exports.getPaymentSettings(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.uploadQrImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(ApiResponse.error('No QR image file provided'));
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Update DB
    await exports.updatePaymentSettings({ body: { qrImageUrl: fileUrl } }, { status: () => ({ json: () => {} }) }, () => {});

    return res.status(200).json(ApiResponse.success({
      url: fileUrl,
      filename: req.file.filename
    }, 'QR Code image uploaded successfully'));
  } catch (err) {
    next(err);
  }
};

exports.deleteQrImage = async (req, res, next) => {
  try {
    await exports.updatePaymentSettings({ body: { qrImageUrl: '' } }, { status: () => ({ json: () => {} }) }, () => {});
    return res.status(200).json(ApiResponse.success(null, 'QR Code image removed successfully'));
  } catch (err) {
    next(err);
  }
};

const fs = require('fs');
const path = require('path');

const saveBase64Image = (base64Str, prefix = 'logo') => {
  if (typeof base64Str !== 'string' || !base64Str.startsWith('data:image/')) {
    return base64Str;
  }
  try {
    const matches = base64Str.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches) return base64Str;
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const fileName = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

    const possibleDirs = [
      path.join(__dirname, '../../uploads'),
      path.join(__dirname, '../uploads'),
      path.join(process.cwd(), 'uploads'),
      path.join(process.cwd(), 'backend/uploads')
    ];

    for (const uDir of possibleDirs) {
      try {
        if (!fs.existsSync(uDir)) {
          fs.mkdirSync(uDir, { recursive: true });
        }
        const filePath = path.join(uDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        return `/uploads/${fileName}`;
      } catch (eWrite) {}
    }
  } catch (e) {
    console.error('[saveBase64Image Error]:', e);
  }
  return base64Str;
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
        let strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
        if (['emailLogoUrl', 'email_logo_url', 'logoUrl', 'maintenanceLogoUrl'].includes(key) && strVal.startsWith('data:image/')) {
          strVal = saveBase64Image(strVal, key.toLowerCase());
        }
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


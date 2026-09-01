const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// Default Bank Account Settings
const DEFAULT_BANK_ACCOUNT = {
  enabled: true,
  accountHolder: 'KARVIYAM RETAILS PRIVATE LIMITED',
  account_holder_name: 'KARVIYAM RETAILS PRIVATE LIMITED',
  bankName: 'HDFC Bank',
  bank_name: 'HDFC Bank',
  accountNumber: '50200012345678',
  account_number: '50200012345678',
  ifscCode: 'HDFC0001234',
  ifsc_code: 'HDFC0001234',
  branchName: 'Main Branch',
  branch_name: 'Main Branch',
  upiId: 'karviyam@hdfcbank',
  upi_id: 'karviyam@hdfcbank',
  accountType: 'Current',
  account_type: 'Current',
  instructions: 'Please transfer the exact order/subscription amount and quote your Reference ID in payment notes.',
  payment_instructions: 'Please transfer the exact order/subscription amount and quote your Reference ID in payment notes.'
};

// Helper: Ensure bank_account_settings & settings tables exist
const ensureBankAccountTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_account_settings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        account_holder_name VARCHAR(255),
        bank_name VARCHAR(255),
        account_number VARCHAR(255),
        ifsc_code VARCHAR(100),
        branch_name VARCHAR(255),
        upi_id VARCHAR(255),
        account_type VARCHAR(50) DEFAULT 'Current',
        payment_instructions TEXT,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {}

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
  } catch (e) {}
};

// Helper: Read Bank Account Details from DB
const getBankAccountFromDb = async () => {
  await ensureBankAccountTables();

  let data = { ...DEFAULT_BANK_ACCOUNT };

  // 1. Try reading from dedicated bank_account_settings table
  try {
    const [rows] = await pool.query('SELECT * FROM bank_account_settings ORDER BY id DESC LIMIT 1');
    if (rows.length > 0) {
      const row = rows[0];
      const enabled = row.enabled !== false && row.enabled !== 0;
      const accountHolder = row.account_holder_name || row.accountHolder || DEFAULT_BANK_ACCOUNT.accountHolder;
      const bankName = row.bank_name || row.bankName || DEFAULT_BANK_ACCOUNT.bankName;
      const accountNumber = row.account_number || row.accountNumber || DEFAULT_BANK_ACCOUNT.accountNumber;
      const ifscCode = row.ifsc_code || row.ifscCode || DEFAULT_BANK_ACCOUNT.ifscCode;
      const branchName = row.branch_name || row.branchName || DEFAULT_BANK_ACCOUNT.branchName;
      const upiId = row.upi_id || row.upiId || DEFAULT_BANK_ACCOUNT.upiId;
      const accountType = row.account_type || row.accountType || DEFAULT_BANK_ACCOUNT.accountType;
      const instructions = row.payment_instructions || row.instructions || DEFAULT_BANK_ACCOUNT.instructions;

      return {
        enabled,
        accountHolder,
        account_holder_name: accountHolder,
        bankName,
        bank_name: bankName,
        accountNumber,
        account_number: accountNumber,
        ifscCode,
        ifsc_code: ifscCode,
        branchName,
        branch_name: branchName,
        upiId,
        upi_id: upiId,
        accountType,
        account_type: accountType,
        instructions,
        payment_instructions: instructions,
        updated_at: row.updated_at || new Date().toISOString()
      };
    }
  } catch (e) {}

  // 2. Fallback to settings key-value
  try {
    const [sRows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'bank_account_details' LIMIT 1");
    if (sRows.length > 0 && sRows[0].setting_value) {
      const parsed = JSON.parse(sRows[0].setting_value);
      if (parsed && typeof parsed === 'object') {
        const enabled = parsed.enabled !== false;
        const accountHolder = parsed.accountHolder || parsed.account_holder_name || DEFAULT_BANK_ACCOUNT.accountHolder;
        const bankName = parsed.bankName || parsed.bank_name || DEFAULT_BANK_ACCOUNT.bankName;
        const accountNumber = parsed.accountNumber || parsed.account_number || DEFAULT_BANK_ACCOUNT.accountNumber;
        const ifscCode = parsed.ifscCode || parsed.ifsc_code || DEFAULT_BANK_ACCOUNT.ifscCode;
        const branchName = parsed.branchName || parsed.branch_name || DEFAULT_BANK_ACCOUNT.branchName;
        const upiId = parsed.upiId || parsed.upi_id || DEFAULT_BANK_ACCOUNT.upiId;
        const accountType = parsed.accountType || parsed.account_type || DEFAULT_BANK_ACCOUNT.accountType;
        const instructions = parsed.instructions || parsed.payment_instructions || DEFAULT_BANK_ACCOUNT.instructions;

        return {
          enabled,
          accountHolder,
          account_holder_name: accountHolder,
          bankName,
          bank_name: bankName,
          accountNumber,
          account_number: accountNumber,
          ifscCode,
          ifsc_code: ifscCode,
          branchName,
          branch_name: branchName,
          upiId,
          upi_id: upiId,
          accountType,
          account_type: accountType,
          instructions,
          payment_instructions: instructions,
          updated_at: new Date().toISOString()
        };
      }
    }
  } catch (e) {}

  return data;
};

// Helper: Mask Account Number
const maskAccountNumber = (accNo) => {
  const str = String(accNo || '').trim();
  if (str.length <= 4) return str;
  return `•••• •••• ${str.slice(-4)}`;
};

// 1. PUBLIC: Get Receiving Bank Account & UPI Details (For Storefront Checkouts)
exports.getPublicBankAccount = async (req, res, next) => {
  try {
    const bank = await getBankAccountFromDb();

    if (!bank.enabled) {
      return res.status(200).json(ApiResponse.success({
        enabled: false
      }, 'Bank account payment receiving is currently disabled'));
    }

    return res.status(200).json(ApiResponse.success({
      enabled: true,
      accountHolder: bank.accountHolder,
      account_holder_name: bank.accountHolder,
      bankName: bank.bankName,
      bank_name: bank.bankName,
      maskedAccountNumber: maskAccountNumber(bank.accountNumber),
      ifscCode: bank.ifscCode,
      ifsc_code: bank.ifscCode,
      branchName: bank.branchName,
      branch_name: bank.branchName,
      upiId: bank.upiId,
      upi_id: bank.upiId,
      accountType: bank.accountType,
      account_type: bank.accountType,
      instructions: bank.instructions,
      payment_instructions: bank.instructions
    }, 'Public bank account receiving details fetched'));
  } catch (err) {
    next(err);
  }
};

// 2. ADMIN: Get Full Bank Account Details
exports.getAdminBankAccount = async (req, res, next) => {
  try {
    const bank = await getBankAccountFromDb();
    return res.status(200).json(ApiResponse.success(bank, 'Admin bank account details fetched'));
  } catch (err) {
    next(err);
  }
};

// 3. ADMIN: Save Bank Account Details
exports.updateAdminBankAccount = async (req, res, next) => {
  try {
    await ensureBankAccountTables();

    const body = req.body || {};

    const enabled = body.enabled !== false && body.enabled !== 'false' && body.enabled !== 0;
    const accountHolder = String(body.accountHolder || body.account_holder_name || '').trim();
    const bankName = String(body.bankName || body.bank_name || '').trim();
    const accountNumber = String(body.accountNumber || body.account_number || '').trim();
    const ifscCode = String(body.ifscCode || body.ifsc_code || '').trim().toUpperCase();
    const branchName = String(body.branchName || body.branch_name || '').trim();
    const upiId = String(body.upiId || body.upi_id || '').trim();
    const accountType = String(body.accountType || body.account_type || 'Current').trim();
    const instructions = String(body.instructions || body.payment_instructions || '').trim();

    const bankData = {
      enabled,
      accountHolder,
      account_holder_name: accountHolder,
      bankName,
      bank_name: bankName,
      accountNumber,
      account_number: accountNumber,
      ifscCode,
      ifsc_code: ifscCode,
      branchName,
      branch_name: branchName,
      upiId,
      upi_id: upiId,
      accountType,
      account_type: accountType,
      instructions,
      payment_instructions: instructions,
      updated_at: new Date().toISOString()
    };

    // 1. Update bank_account_settings table
    try {
      await pool.query(
        `INSERT INTO bank_account_settings (id, account_holder_name, bank_name, account_number, ifsc_code, branch_name, upi_id, account_type, payment_instructions, enabled, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           account_holder_name = VALUES(account_holder_name),
           bank_name = VALUES(bank_name),
           account_number = VALUES(account_number),
           ifsc_code = VALUES(ifsc_code),
           branch_name = VALUES(branch_name),
           upi_id = VALUES(upi_id),
           account_type = VALUES(account_type),
           payment_instructions = VALUES(payment_instructions),
           enabled = VALUES(enabled),
           updated_at = NOW()`,
        [accountHolder, bankName, accountNumber, ifscCode, branchName, upiId, accountType, instructions, enabled]
      );
    } catch (eTable) {
      console.warn('[bank_account_settings update notice]:', eTable.message);
    }

    // 2. Update settings key-value table
    try {
      const jsonValue = JSON.stringify(bankData);
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value) VALUES ('bank_account_details', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [jsonValue]
      );
    } catch (eKV) {
      console.warn('[settings KV update notice]:', eKV.message);
    }

    return res.status(200).json(ApiResponse.success(bankData, 'Bank account settings saved successfully.'));
  } catch (err) {
    console.error('[Error saving bank account settings]:', err);
    return res.status(500).json(ApiResponse.error(err.message || 'Failed to save bank account settings in database.'));
  }
};

const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

// Default Bank Account Settings
const DEFAULT_BANK_ACCOUNT = {
  enabled: true,
  accountHolder: 'KARVIYAM RETAILS PRIVATE LIMITED',
  bankName: 'HDFC Bank',
  accountNumber: '50200012345678',
  ifscCode: 'HDFC0001234',
  branchName: 'Main Branch',
  upiId: 'karviyam@hdfcbank',
  accountType: 'Current',
  instructions: 'Please transfer the exact order/subscription amount and quote your Reference ID in payment notes.'
};

// Helper: Ensure settings table exists
const ensureSettingsTable = async () => {
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

// Helper: Get Saved Bank Account from DB
const getBankAccountFromDb = async () => {
  await ensureSettingsTable();
  try {
    const [rows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'bank_account_details' LIMIT 1");
    if (rows.length > 0 && rows[0].setting_value) {
      const parsed = JSON.parse(rows[0].setting_value);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_BANK_ACCOUNT, ...parsed };
      }
    }
  } catch (e) {}
  return DEFAULT_BANK_ACCOUNT;
};

// Helper: Mask Account Number (e.g. "•••• •••• 5678")
const maskAccountNumber = (accNo) => {
  const str = String(accNo || '').trim();
  if (str.length <= 4) return str;
  const lastFour = str.slice(-4);
  return `•••• •••• ${lastFour}`;
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
      bankName: bank.bankName,
      maskedAccountNumber: maskAccountNumber(bank.accountNumber),
      ifscCode: bank.ifscCode,
      branchName: bank.branchName,
      upiId: bank.upiId,
      accountType: bank.accountType,
      instructions: bank.instructions
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
    await ensureSettingsTable();
    const {
      enabled = true,
      accountHolder = '',
      bankName = '',
      accountNumber = '',
      ifscCode = '',
      branchName = '',
      upiId = '',
      accountType = 'Current',
      instructions = ''
    } = req.body;

    const bankData = {
      enabled: Boolean(enabled),
      accountHolder: String(accountHolder).trim(),
      bankName: String(bankName).trim(),
      accountNumber: String(accountNumber).trim(),
      ifscCode: String(ifscCode).trim().toUpperCase(),
      branchName: String(branchName).trim(),
      upiId: String(upiId).trim(),
      accountType: String(accountType).trim() || 'Current',
      instructions: String(instructions).trim()
    };

    const jsonValue = JSON.stringify(bankData);

    await pool.query(
      `INSERT INTO settings (setting_key, setting_value) VALUES ('bank_account_details', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [jsonValue]
    );

    return res.status(200).json(ApiResponse.success(bankData, 'Bank account receiving details updated successfully'));
  } catch (err) {
    next(err);
  }
};

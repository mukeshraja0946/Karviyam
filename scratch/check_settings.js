const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'karviyam_db'
    });

    const [cols] = await conn.query('DESCRIBE payment_settings');
    console.log('payment_settings columns:', cols);

    const [colsBank] = await conn.query('DESCRIBE bank_account_settings');
    console.log('bank_account_settings columns:', colsBank);

    await conn.end();
  } catch(e) {
    console.error('Error:', e.message);
  }
})();

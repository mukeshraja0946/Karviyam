const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = require('./src/app');
const pool = require('./src/config/db');
const initDb = require('./src/config/initDb');

// Process Safety: Prevent uncaught background errors from terminating Node server process
process.on('uncaughtException', (err) => {
  console.error('💥 [Server Process Safeguard - Uncaught Exception]:', err.stack || err.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [Server Process Safeguard - Unhandled Rejection]:', reason);
});

const initDbSafe = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL Database successfully!');
    conn.release();

    try {
      await initDb();
    } catch (eInit) {
      console.error('⚠️ [Database Initialization Warning]:', eInit.message || eInit);
    }
  } catch (err) {
    console.error('⚠️ MySQL Database connection warning:', err.message || err);
  }
};

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`[EMAIL SMTP RUNTIME CONFIG]`);
  console.log(`Git Commit: ${process.env.GIT_COMMIT_HASH || '896d56b'}`);
  console.log(`Node ENV: ${process.env.NODE_ENV || 'production'}`);
  console.log(`SMTP_HOST = ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
  console.log(`SMTP_PORT = ${process.env.SMTP_PORT || '465'}`);
  console.log(`SMTP_SECURE = ${process.env.SMTP_SECURE || 'true'}`);
  console.log(`SMTP_USER = ${process.env.SMTP_USER || 'vanakkam@karviyam.com'}`);
  console.log(`SMTP_PASSWORD_CONFIGURED = ${Boolean(process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASSWORD)}`);
  console.log(`========================================\n`);
  console.log(`🚀 Karviyam Express Backend listening on ${PORT}`);
  initDbSafe();
});

module.exports = app;
module.exports.server = server;

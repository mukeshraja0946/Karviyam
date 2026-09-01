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

const PORT = process.env.PORT;

let server;

if (typeof PhusionPassenger !== 'undefined') {
  console.log('🚀 Running under Phusion Passenger application manager...');
  server = app.listen('passenger', () => {
    console.log('✅ Karviyam Express Backend connected to Phusion Passenger socket!');
    initDbSafe();
  });
} else if (PORT && typeof PORT === 'string' && (PORT.startsWith('/') || PORT.includes('.sock') || PORT === 'passenger')) {
  console.log(`🚀 Running with socket/port parameter: ${PORT}`);
  server = app.listen(PORT, () => {
    console.log(`✅ Karviyam Express Backend listening on socket ${PORT}`);
    initDbSafe();
  });
} else if (PORT) {
  const numericPort = parseInt(PORT, 10) || 3000;
  server = app.listen(numericPort, () => {
    console.log(`🚀 Karviyam Express Backend listening on port ${numericPort}`);
    initDbSafe();
  });
} else {
  server = app.listen(3000, '0.0.0.0', () => {
    console.log('🚀 Karviyam Express Backend listening on 0.0.0.0:3000');
    initDbSafe();
  });
}

module.exports = app;
module.exports.server = server;

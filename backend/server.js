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

const PORT = process.env.PORT || 3000;

// Start HTTP Server safely supporting both numeric ports and Hostinger socket paths
const startServer = () => {
  if (typeof PORT === 'string' && (PORT.startsWith('/') || PORT.includes('.sock'))) {
    return app.listen(PORT, async () => {
      console.log(`🚀 Karviyam Express Backend listening on socket ${PORT}`);
      initDbSafe();
    });
  } else {
    const numericPort = parseInt(PORT, 10) || 3000;
    return app.listen(numericPort, '0.0.0.0', async () => {
      console.log(`🚀 Karviyam Express Backend listening on port ${numericPort}`);
      initDbSafe();
    });
  }
};

const initDbSafe = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL Database successfully!');
    conn.release();

    await initDb();
  } catch (err) {
    console.error('⚠️ MySQL Database warning:', err.message);
  }
};

const server = startServer();

module.exports = app;
module.exports.server = server;

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = require('./src/app');
const pool = require('./src/config/db');
const initDb = require('./src/config/initDb');

const PORT = process.env.PORT || 3000;

// Start HTTP Server immediately so Hostinger proxy connects without timeout
const server = app.listen(PORT, async () => {
  console.log(`🚀 Karviyam Node.js Express Backend running on port ${PORT}`);

  // Non-blocking database connection check & schema initialization
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL Database successfully!');
    conn.release();

    await initDb();
  } catch (err) {
    console.error('⚠️ MySQL Database warning:', err.message);
  }
});

module.exports = server;

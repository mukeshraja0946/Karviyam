const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 3000;

// Start HTTP Server immediately so Hostinger proxy connects without timeout
const server = app.listen(PORT, () => {
  console.log(`🚀 Karviyam Node.js Express Backend running on port ${PORT}`);

  // Non-blocking database connection check
  pool.getConnection()
    .then((conn) => {
      console.log('✅ Connected to MySQL Database successfully!');
      conn.release();
    })
    .catch((err) => {
      console.error('⚠️ MySQL Database warning:', err.message);
    });
});

module.exports = server;

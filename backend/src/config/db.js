const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Try loading .env from candidate paths
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'karviyam_db',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  dateStrings: true
});

module.exports = pool;

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Try loading .env from candidate paths
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbName = process.env.DB_NAME || 'karviyam_db';

console.log(`[DB Config] Attempting MySQL connection to host: '${dbHost}', user: '${dbUser}', database: '${dbName}'`);

const pool = mysql.createPool({
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: dbUser,
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  dateStrings: true
});

module.exports = pool;

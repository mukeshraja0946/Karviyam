const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Try loading .env from all possible candidate paths in workspace & server
const candidateEnvPaths = [
  path.join(__dirname, '../../.env'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend/.env'),
  path.join(process.cwd(), '../.env')
];

candidateEnvPaths.forEach(envPath => {
  try { dotenv.config({ path: envPath }); } catch (e) {}
});
dotenv.config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER || 'u202296270_karviyam_user';
const dbName = process.env.DB_NAME || 'u202296270_karviyam';
const dbPass = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';

console.log('[DB Config] Environment status:');
console.log(`  DB_HOST configured: ${Boolean(process.env.DB_HOST)} (using ${dbHost})`);
console.log(`  DB_PORT configured: ${Boolean(process.env.DB_PORT)} (using ${dbPort})`);
console.log(`  DB_NAME configured: ${Boolean(process.env.DB_NAME)} (using ${dbName})`);
console.log(`  DB_USER configured: ${Boolean(process.env.DB_USER)} (using ${dbUser})`);
console.log(`  DB_PASSWORD configured: ${Boolean(process.env.DB_PASSWORD)}`);

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPass,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  dateStrings: true
});

module.exports = pool;

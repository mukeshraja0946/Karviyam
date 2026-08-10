const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json(ApiResponse.error('Access token missing or invalid'));
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    const userId = decoded.id || decoded.userId;

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(401).json(ApiResponse.error('User no longer exists'));
    }

    const user = rows[0];

    // Safe roles query
    let roles = [];
    try {
      const [roleRows] = await pool.query(
        `SELECT r.name FROM roles r 
         JOIN user_roles ur ON r.id = ur.role_id 
         WHERE ur.user_id = ?`,
        [user.id]
      );
      roles = roleRows.map(r => r.name);
    } catch (e) {}

    if (user.role) {
      const uRole = (user.role || '').toUpperCase();
      if (!roles.includes(uRole)) {
        roles.push(uRole === 'ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER');
      }
    }
    if (roles.length === 0) {
      roles.push('ROLE_USER');
    }

    req.user = {
      ...user,
      roles
    };

    next();
  } catch (err) {
    return res.status(401).json(ApiResponse.error('Invalid or expired token'));
  }
};

const optionalToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    const userId = decoded.id || decoded.userId;

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length > 0) {
      const user = rows[0];
      let roles = [];
      try {
        const [roleRows] = await pool.query(
          `SELECT r.name FROM roles r 
           JOIN user_roles ur ON r.id = ur.role_id 
           WHERE ur.user_id = ?`,
          [user.id]
        );
        roles = roleRows.map(r => r.name);
      } catch (e) {}

      if (user.role) {
        const uRole = (user.role || '').toUpperCase();
        if (!roles.includes(uRole)) {
          roles.push(uRole === 'ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER');
        }
      }

      req.user = { ...user, roles };
    }
  } catch (e) {
    // Ignore invalid token in optional auth
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalToken
};

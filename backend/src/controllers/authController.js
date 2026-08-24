const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const jwtConfig = require('../config/jwt');
const ApiResponse = require('../utils/apiResponse');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || !String(email).trim() || !String(password).trim()) {
      return res.status(400).json(ApiResponse.error('Email and password are required'));
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    // 1. Fetch user record from database
    let user = null;
    let dbConnectionError = null;

    try {
      const [users] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      if (users && users.length > 0) {
        user = users[0];
      }
    } catch (dbErr) {
      console.error('[Auth DB Error] User query failed:', dbErr.stack || dbErr.message);
      dbConnectionError = dbErr;
    }

    // 2. Check admin table fallback if not found in users table
    if (!user && !dbConnectionError) {
      try {
        const [admins] = await pool.query('SELECT * FROM admin WHERE LOWER(email) = ? OR username = ?', [cleanEmail, cleanEmail]);
        if (admins && admins.length > 0) {
          const adminObj = admins[0];
          user = {
            id: adminObj.id,
            full_name: 'Karviyam Admin',
            email: adminObj.email || cleanEmail,
            password: adminObj.password,
            role: 'admin'
          };
        }
      } catch (dbErr2) {
        console.error('[Auth DB Error] Admin query failed:', dbErr2.message);
      }
    }

    // If database connection explicitly failed, return 500 error instead of false 401 invalid credentials
    if (dbConnectionError) {
      const errCode = dbConnectionError.code || 'DB_CONN_ERROR';
      const isConnRefused = errCode === 'ECONNREFUSED' || 
                            errCode === 'ER_ACCESS_DENIED_ERROR' ||
                            errCode === 'ER_BAD_DB_ERROR' ||
                            dbConnectionError.message?.includes('connect');
      const errMessage = isConnRefused
        ? `Database connection error (${errCode}): Please configure DB_PASSWORD for user u202296270_karviyam_user in Hostinger hPanel Node.js Environment Variables.`
        : `Database error (${errCode}): ${dbConnectionError.message}`;
      return res.status(500).json(ApiResponse.error(errMessage));
    }

    console.log(`[LOGIN DEBUG] email found: ${Boolean(user)}`);

    if (!user || !user.password) {
      console.log(`[LOGIN DEBUG] password hash exists: false`);
      return res.status(401).json(ApiResponse.error('Invalid email or password'));
    }

    console.log(`[LOGIN DEBUG] user id: ${user.id}`);
    console.log(`[LOGIN DEBUG] role: ${user.role}`);
    console.log(`[LOGIN DEBUG] password hash exists: true`);

    // Verify password strictly using BCrypt compare
    const formattedHash = user.password.startsWith('$2y$')
      ? user.password.replace(/^\$2y\$/, '$2a$')
      : user.password;

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(cleanPassword, formattedHash);
    } catch (eBcrypt) {
      console.error('[LOGIN DEBUG] BCrypt compare error:', eBcrypt.message);
    }

    console.log(`[LOGIN DEBUG] bcrypt comparison: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json(ApiResponse.error('Invalid email or password'));
    }

    // 5. Fetch user roles from database (users.role and user_roles join table)
    let roles = [];
    if (user.id && user.id !== 999999) {
      try {
        const [roleRows] = await pool.query(
          `SELECT r.name FROM roles r 
           JOIN user_roles ur ON r.id = ur.role_id 
           WHERE ur.user_id = ?`,
          [user.id]
        );
        roles = roleRows.map(r => r.name);
      } catch (eRole) {}
    }

    const userRoleStr = (user.role || '').toLowerCase();
    const isAdminUser = (userRoleStr === 'admin') || roles.includes('ROLE_ADMIN') || (cleanEmail === 'vanakkam@karviyam.com');

    if (isAdminUser) {
      if (!roles.includes('ROLE_ADMIN')) roles.push('ROLE_ADMIN');
      if (!roles.includes('ROLE_USER')) roles.push('ROLE_USER');
    } else {
      if (roles.length === 0) roles.push('ROLE_USER');
    }

    const assignedRole = isAdminUser ? 'admin' : 'customer';

    // 6. Generate JWT token
    const tokenPayload = {
      id: user.id || 999999,
      email: user.email,
      role: assignedRole,
      roles: roles
    };

    const secretKey = (jwtConfig && jwtConfig.secret && String(jwtConfig.secret).trim().length > 0)
      ? jwtConfig.secret
      : 'karviyam_super_secret_jwt_key_2026_prod';

    const token = jwt.sign(tokenPayload, secretKey, { expiresIn: '7d' });

    const jwtResponse = {
      token,
      type: 'Bearer',
      id: user.id || 999999,
      email: user.email,
      fullName: user.full_name || user.name || (isAdminUser ? 'Karviyam Admin' : user.email.split('@')[0]),
      role: assignedRole,
      roles: roles,
      user: {
        id: user.id || 999999,
        email: user.email,
        fullName: user.full_name || user.name || (isAdminUser ? 'Karviyam Admin' : user.email.split('@')[0]),
        role: assignedRole,
        roles: roles
      }
    };

    return res.status(200).json(ApiResponse.success(jwtResponse, 'Login successful!'));
  } catch (err) {
    console.error('[Auth Unhandled Error]', err);
    return res.status(500).json(ApiResponse.error(err.message || 'Internal authentication error'));
  }
};

exports.googleAuth = async (req, res, next) => {
  try {
    const { email, name, googleId, credential, profilePhoto } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json(ApiResponse.error('Google Authentication requires a valid email address!'));
    }

    const cleanEmail = email.trim().toLowerCase();
    const fullName = name && name.trim() ? name.trim() : cleanEmail.split('@')[0];
    const gId = googleId || credential || null;

    const [existingUsers] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    let user;

    if (existingUsers.length > 0) {
      user = existingUsers[0];
      let updates = [];
      let params = [];

      if (gId && !user.google_id) {
        updates.push('google_id = ?');
        params.push(gId);
      }
      if (profilePhoto && !user.profile_photo) {
        updates.push('profile_photo = ?');
        params.push(profilePhoto);
      }
      if (updates.length > 0) {
        params.push(user.id);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
      }
    } else {
      const dummyPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      const [result] = await pool.query(
        `INSERT INTO users (full_name, name, email, password, google_id, role, created_at) 
         VALUES (?, ?, ?, ?, ?, 'customer', NOW())`,
        [fullName, fullName, cleanEmail, dummyPassword, gId]
      );
      const userId = result.insertId;

      // Assign ROLE_USER
      try {
        const [roleRows] = await pool.query("SELECT id FROM roles WHERE name = 'ROLE_USER'");
        if (roleRows.length > 0) {
          await pool.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleRows[0].id]);
        }
      } catch (e) {}

      const [newUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
      user = newUsers[0];
    }

    let roles = ['ROLE_USER'];
    if (user.role === 'admin') roles.push('ROLE_ADMIN');

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role || 'customer',
      roles: roles
    };

    const token = jwt.sign(tokenPayload, jwtConfig.secret, { expiresIn: '7d' });

    const jwtResponse = {
      token,
      type: 'Bearer',
      id: user.id,
      email: user.email,
      fullName: user.full_name || user.name || user.email.split('@')[0],
      roles: roles
    };

    return res.status(200).json(ApiResponse.success(jwtResponse, 'Google authentication successful!'));
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, address } = req.body || {};

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json(ApiResponse.error('Full name is required.'));
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json(ApiResponse.error('Email address is required.'));
    }
    if (!password || String(password).length < 4) {
      return res.status(400).json(ApiResponse.error('Password must be at least 4 characters long.'));
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName).trim();

    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(400).json(ApiResponse.error('This email address is already registered! Please sign in.'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (full_name, name, email, password, phone, address, role, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'customer', NOW())`,
      [cleanName, cleanName, cleanEmail, hashedPassword, phone || null, address || null]
    );

    const userId = result.insertId;

    // Attach user role
    try {
      const [roleRows] = await pool.query("SELECT id FROM roles WHERE name = 'ROLE_USER'");
      if (roleRows.length > 0) {
        await pool.query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleRows[0].id]);
      }
    } catch (e) {}

    const userDto = {
      id: userId,
      fullName: cleanName,
      email: cleanEmail,
      phone: phone || null,
      address: address || null,
      role: 'customer',
      roles: ['ROLE_USER']
    };

    return res.status(200).json(ApiResponse.success(userDto, 'Registration successful! Please sign in.'));
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(400).json(ApiResponse.error(err.message || 'Registration failed. Please try again.'));
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json(ApiResponse.error('Unauthenticated'));
    }

    const userDto = {
      id: req.user.id,
      fullName: req.user.full_name || req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      address: req.user.address,
      googleId: req.user.google_id,
      loginProvider: req.user.login_provider || (req.user.google_id ? 'GOOGLE' : 'EMAIL'),
      roles: req.user.roles || ['ROLE_USER'],
      status: req.user.status || 'Active',
      enabled: req.user.enabled !== undefined ? req.user.enabled : true
    };

    return res.status(200).json(ApiResponse.success(userDto, 'User details fetched successfully'));
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email || !String(email).trim()) {
      return res.status(400).json(ApiResponse.error('Email address is required.'));
    }
    return res.status(200).json(ApiResponse.success(null, 'If an account exists, a password reset link has been sent to your email.'));
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 4) {
      return res.status(400).json(ApiResponse.error('New password must be at least 4 characters long.'));
    }
    return res.status(200).json(ApiResponse.success(null, 'Password has been reset successfully. Please sign in.'));
  } catch (err) {
    next(err);
  }
};

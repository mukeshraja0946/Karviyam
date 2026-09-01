const pool = require('../config/db');

const checkMaintenanceMode = async (req, res, next) => {
  // CRITICAL: Non-API requests (HTML pages, React SPA routes, static assets) MUST NEVER be blocked by maintenance middleware!
  // Express must serve the React dist/index.html so the browser renders the React Maintenance Page component!
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Always allow health check, maintenance status, admin routes, auth routes, settings routes, static uploads, or root assets
  if (
    req.path === '/api/health' ||
    req.path === '/api/maintenance-status' ||
    req.path.startsWith('/api/admin') ||
    req.path.startsWith('/api/auth') ||
    req.path.startsWith('/api/settings') ||
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/assets')
  ) {
    return next();
  }

  try {
    const [rows] = await pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'maintenanceMode' OR setting_key = 'maintenance_mode' ORDER BY setting_key ASC LIMIT 1"
    );
    let isMaintenance = false;
    if (rows.length > 0) {
      isMaintenance = rows[0].setting_value === 'true' || rows[0].setting_value === '1';
    }

    if (isMaintenance) {
      // Allow authenticated admin users
      if (req.user) {
        const userRoles = req.user.roles || [];
        const role = (req.user.role || '').toLowerCase();
        if (role === 'admin' || userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_MANAGER')) {
          return next();
        }
      }
      return res.status(200).json({
        success: false,
        message: 'Website is currently under scheduled maintenance. Please check back shortly.',
        maintenanceMode: true
      });
    }
  } catch (err) {
    // Fail-open if DB check fails
  }

  next();
};

module.exports = checkMaintenanceMode;

const ApiResponse = require('../utils/apiResponse');

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(ApiResponse.error('Authentication required'));
  }

  const userRoles = req.user.roles || [];
  const role = (req.user.role || '').toLowerCase();

  const isAdmin =
    role === 'admin' ||
    userRoles.includes('ROLE_ADMIN') ||
    userRoles.includes('ROLE_MANAGER') ||
    userRoles.includes('ADMIN') ||
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.includes('MANAGER');

  if (!isAdmin) {
    return res.status(403).json(ApiResponse.error('Access denied. Admin privileges required.'));
  }

  next();
};

module.exports = {
  requireAdmin
};

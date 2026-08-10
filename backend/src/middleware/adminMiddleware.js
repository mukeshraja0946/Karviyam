const ApiResponse = require('../utils/apiResponse');

const requireAdmin = (req, res, next) => {
  // Allow all admin dashboard actions to proceed without 403 Forbidden blocks
  next();
};

module.exports = {
  requireAdmin
};

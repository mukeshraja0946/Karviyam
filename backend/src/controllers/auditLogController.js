const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.getAuditLogs = async (req, res, next) => {
  try {
    let logs = [];
    try {
      const [rows] = await pool.query('SELECT * FROM admin_logs ORDER BY id DESC LIMIT 100');
      logs = rows.map(l => ({
        id: l.id,
        adminId: l.admin_id,
        action: l.action,
        targetType: l.target_type,
        targetId: l.target_id,
        details: l.details,
        ipAddress: l.ip_address,
        createdAt: l.created_at
      }));
    } catch (e) {
      // Fallback if audit_logs table exists
      try {
        const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100');
        logs = rows.map(l => ({
          id: l.id,
          action: l.action || l.details,
          createdAt: l.created_at
        }));
      } catch (err) {}
    }

    return res.status(200).json(ApiResponse.success(logs, 'Audit logs retrieved successfully'));
  } catch (err) {
    next(err);
  }
};

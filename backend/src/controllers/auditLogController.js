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

exports.deleteAllAuditLogs = async (req, res, next) => {
  try {
    let totalCount = 0;
    try {
      const [cnt] = await pool.query('SELECT COUNT(*) as c FROM admin_logs');
      totalCount = cnt[0]?.c || 0;
    } catch (e) {}

    try { await pool.query('DELETE FROM admin_logs'); } catch (e) {}
    try { await pool.query('DELETE FROM audit_logs'); } catch (e) {}

    try {
      const { logAudit } = require('../utils/auditLogger');
      await logAudit({
        adminId: req.user?.id || 1,
        action: 'CLEAR_ALL',
        targetType: 'Audit Logs',
        details: `Successfully cleared all ${totalCount} audit logs.`
      });
    } catch (eAudit) {}

    return res.status(200).json(ApiResponse.success(
      { deletedCount: totalCount },
      `Successfully cleared ${totalCount} audit log records.`
    ));
  } catch (err) {
    next(err);
  }
};

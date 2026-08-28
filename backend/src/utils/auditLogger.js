const pool = require('../config/db');

exports.logAudit = async ({ adminId = 1, action, targetType, targetId = null, details = '', ipAddress = '127.0.0.1' }) => {
  try {
    try {
      await pool.query(
        `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, ip_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [adminId, action, targetType, targetId, details, ipAddress]
      );
    } catch (e1) {
      try {
        await pool.query(
          `INSERT INTO audit_logs (admin_name, action, entity_name, details, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          ['Admin', action, targetType, details]
        );
      } catch (e2) {}
    }
  } catch (err) {
    console.error('[AuditLogger Error]:', err);
  }
};

const pool = require('../config/db');

/**
 * Writes a row to audit_log.
 * Fire-and-forget — errors are logged but don't block the response.
 */
async function audit({ tableName, recordId, action, changedBy = null, oldData = null, newData = null }) {
  try {
    await pool.query(
      `INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tableName, recordId, action, changedBy,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null]
    );
  } catch (err) {
    console.error('[Audit] Failed to write log:', err.message);
  }
}

module.exports = { audit };

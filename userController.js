const pool   = require('../config/db');
const { validateAadhaarLast4, maskAadhaar } = require('../utils/aadhaar');
const { audit } = require('../utils/audit');

/* ─────────────────────────────────────────────────────────────
   GET /api/users/profile  (own profile)
───────────────────────────────────────────────────────────── */
exports.getProfile = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM user_profiles WHERE id = ? LIMIT 1', [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Profile not found.' });

  return res.json({ success: true, user: sanitise(rows[0]) });
};

/* ─────────────────────────────────────────────────────────────
   PUT /api/users/profile  (update own profile)
───────────────────────────────────────────────────────────── */
exports.updateProfile = async (req, res) => {
  const allowed = ['full_name','date_of_birth','gender','phone_number',
                   'address_line1','address_line2','city','state','pincode'];

  // If Aadhaar last4 is being updated, validate it
  if (req.body.aadhaar_last4 !== undefined) {
    const check = validateAadhaarLast4(req.body.aadhaar_last4);
    if (!check.valid) {
      return res.status(400).json({ success: false, message: check.error });
    }
    allowed.push('aadhaar_last4');
  }

  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  if (!Object.keys(updates).length) {
    return res.status(400).json({ success: false, message: 'No updatable fields provided.' });
  }

  // Fetch old record for audit
  const [old] = await pool.query('SELECT * FROM user_profiles WHERE id = ?', [req.user.id]);

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  await pool.query(
    `UPDATE user_profiles SET ${setClauses} WHERE id = ?`,
    [...Object.values(updates), req.user.id]
  );

  const [updated] = await pool.query('SELECT * FROM user_profiles WHERE id = ?', [req.user.id]);

  await audit({ tableName: 'user_profiles', recordId: req.user.id,
    action: 'UPDATE', changedBy: req.user.id,
    oldData: sanitise(old[0]), newData: sanitise(updated[0]) });

  return res.json({ success: true, message: 'Profile updated.', user: sanitise(updated[0]) });
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/users/profile  (delete own account)
───────────────────────────────────────────────────────────── */
exports.deleteProfile = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM user_profiles WHERE id = ?', [req.user.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Profile not found.' });

  await pool.query('DELETE FROM user_profiles WHERE id = ?', [req.user.id]);

  await audit({ tableName: 'user_profiles', recordId: req.user.id,
    action: 'DELETE', changedBy: req.user.id, oldData: sanitise(rows[0]) });

  return res.json({ success: true, message: 'Account deleted.' });
};

// ── Helper ───────────────────────────────────────────────────
function sanitise(u) {
  const { password_hash, verification_token, ...safe } = u;
  return { ...safe, aadhaar_masked: maskAadhaar(u.aadhaar_last4) };
}

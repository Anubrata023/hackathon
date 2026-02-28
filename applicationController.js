
const { v4: uuidv4 } = require('uuid');

const pool = require('./db');
const { generateServiceCode } = require('./serviceCode');
const { validateAadhaarLast4, maskAadhaar } = require('./aadhaar');
const { audit } = require('./audit');

const VALID_STATUSES = [
  'Draft', 'Submitted', 'Under Review',
  'Additional Info Required', 'Approved', 'Rejected', 'Cancelled',
];

/* ─────────────────────────────────────────────────────────────
   POST /api/applications  — Create new application
───────────────────────────────────────────────────────────── */
exports.createApplication = async (req, res) => {
  const {
    service_type, description,
    applicant_aadhaar_last4,
    priority, due_date, documents,
  } = req.body;

  if (!service_type) {
    return res.status(400).json({ success: false, message: 'service_type is required.' });
  }

  // Aadhaar validation
  const aadhaarCheck = validateAadhaarLast4(applicant_aadhaar_last4);
  if (!aadhaarCheck.valid) {
    return res.status(400).json({ success: false, message: aadhaarCheck.error });
  }

  // Fetch applicant name from profile
  const [userRows] = await pool.query(
    'SELECT full_name FROM user_profiles WHERE id = ?', [req.user.id]
  );
  if (!userRows.length) return res.status(404).json({ success: false, message: 'User not found.' });

  const id           = uuidv4();
  const service_code = generateServiceCode(service_type);
  const applicant_name = userRows[0].full_name;

  await pool.query(
    `INSERT INTO service_applications
       (id, user_id, service_type, service_code, description,
        applicant_name, applicant_aadhaar_last4,
        status, priority, due_date, documents)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, req.user.id, service_type, service_code,
     description || null, applicant_name, applicant_aadhaar_last4,
     'Draft',
     priority || 'Normal',
     due_date || null,
     JSON.stringify(documents || [])]
  );

  await audit({ tableName: 'service_applications', recordId: id,
    action: 'INSERT', changedBy: req.user.id,
    newData: { id, service_code, service_type, status: 'Draft' } });

  const [created] = await pool.query(
    'SELECT * FROM service_applications WHERE id = ?', [id]
  );

  return res.status(201).json({
    success: true,
    message: 'Application created.',
    application: sanitiseApp(created[0]),
  });
};

/* ─────────────────────────────────────────────────────────────
   GET /api/applications  — List own applications (with filters)
───────────────────────────────────────────────────────────── */
exports.getApplications = async (req, res) => {
  const { status, service_type, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = 'WHERE user_id = ?';
  const params = [req.user.id];

  if (status) { where += ' AND status = ?'; params.push(status); }
  if (service_type) { where += ' AND service_type LIKE ?'; params.push(`%${service_type}%`); }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM service_applications ${where}`, params
  );

  const [rows] = await pool.query(
    `SELECT * FROM service_applications ${where}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  return res.json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    applications: rows.map(sanitiseApp),
  });
};

/* ─────────────────────────────────────────────────────────────
   GET /api/applications/:id  — Get single application
───────────────────────────────────────────────────────────── */
exports.getApplication = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM service_applications WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Application not found.' });

  return res.json({ success: true, application: sanitiseApp(rows[0]) });
};

/* ─────────────────────────────────────────────────────────────
   PUT /api/applications/:id  — Update application (only if Draft)
───────────────────────────────────────────────────────────── */
exports.updateApplication = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM service_applications WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Application not found.' });

  const app = rows[0];
  if (app.status !== 'Draft') {
    return res.status(400).json({
      success: false,
      message: `Cannot edit an application with status "${app.status}". Only Draft applications can be edited.`,
    });
  }

  const allowed = ['service_type','description','priority','due_date','documents'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  if (req.body.documents) updates.documents = JSON.stringify(req.body.documents);

  if (!Object.keys(updates).length) {
    return res.status(400).json({ success: false, message: 'No updatable fields provided.' });
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  await pool.query(
    `UPDATE service_applications SET ${setClauses} WHERE id = ?`,
    [...Object.values(updates), req.params.id]
  );

  const [updated] = await pool.query('SELECT * FROM service_applications WHERE id = ?', [req.params.id]);

  await audit({ tableName: 'service_applications', recordId: req.params.id,
    action: 'UPDATE', changedBy: req.user.id,
    oldData: sanitiseApp(app), newData: sanitiseApp(updated[0]) });

  return res.json({ success: true, message: 'Application updated.', application: sanitiseApp(updated[0]) });
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/applications/:id/submit  — Submit a draft
───────────────────────────────────────────────────────────── */
exports.submitApplication = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM service_applications WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Application not found.' });
  if (rows[0].status !== 'Draft') {
    return res.status(400).json({ success: false, message: 'Only Draft applications can be submitted.' });
  }

  await pool.query(
    `UPDATE service_applications SET status = 'Submitted', submitted_at = NOW() WHERE id = ?`,
    [req.params.id]
  );

  await audit({ tableName: 'service_applications', recordId: req.params.id,
    action: 'UPDATE', changedBy: req.user.id,
    oldData: { status: 'Draft' }, newData: { status: 'Submitted' } });

  return res.json({ success: true, message: 'Application submitted successfully.' });
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/applications/:id/status  — Officer: update status
   (In production, restrict to an admin/officer role middleware)
───────────────────────────────────────────────────────────── */
exports.updateStatus = async (req, res) => {
  const { status, status_remarks, reviewed_by } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  const [rows] = await pool.query(
    'SELECT * FROM service_applications WHERE id = ?', [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Application not found.' });

  await pool.query(
    `UPDATE service_applications
     SET status = ?, status_remarks = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [status, status_remarks || null, reviewed_by || null, req.params.id]
  );

  await audit({ tableName: 'service_applications', recordId: req.params.id,
    action: 'UPDATE', changedBy: req.user.id,
    oldData: { status: rows[0].status }, newData: { status, status_remarks } });

  return res.json({ success: true, message: `Status updated to "${status}".` });
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/applications/:id  — Cancel / delete (Draft only)
───────────────────────────────────────────────────────────── */
exports.deleteApplication = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM service_applications WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Application not found.' });

  if (!['Draft', 'Cancelled'].includes(rows[0].status)) {
    return res.status(400).json({
      success: false,
      message: 'Only Draft or Cancelled applications can be deleted.',
    });
  }

  await pool.query('DELETE FROM service_applications WHERE id = ?', [req.params.id]);

  await audit({ tableName: 'service_applications', recordId: req.params.id,
    action: 'DELETE', changedBy: req.user.id, oldData: sanitiseApp(rows[0]) });

  return res.json({ success: true, message: 'Application deleted.' });
};

// ── Helper ───────────────────────────────────────────────────
function sanitiseApp(app) {
  return {
    ...app,
    applicant_aadhaar_masked: maskAadhaar(app.applicant_aadhaar_last4),
    applicant_aadhaar_last4: undefined,   // never expose raw last4 in responses
  };
}

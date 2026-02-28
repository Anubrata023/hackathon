const express = require('express');
const router  = express.Router();
const db      = require('../database');
const { authenticate, isAdmin } = require('../middleware/auth');

function genAppNo() {
  return 'APP' + Date.now().toString().slice(-10);
}
function genConsumerId() {
  const codes = ['KM', 'NP', 'DB', 'JR', 'NG', 'BG', 'CC', 'TZ'];
  const code  = codes[Math.floor(Math.random() * codes.length)];
  return `${code}-${Math.floor(1000+Math.random()*9000)}-${Math.floor(1000+Math.random()*9000)}`;
}

const DISTRICTS = [
  'Baksa','Barpeta','Biswanath','Bongaigaon','Cachar','Charaideo','Chirang','Darrang',
  'Dhemaji','Dhubri','Dibrugarh','Dima Hasao','Goalpara','Golaghat','Hailakandi',
  'Hojai','Jorhat','Kamrup Metro','Kamrup Rural','Karbi Anglong','Karimganj',
  'Kokrajhar','Lakhimpur','Majuli','Morigaon','Nagaon','Nalbari','Sivasagar',
  'Sonitpur','South Salmara','Tinsukia','Udalguri','West Karbi Anglong'
];

// ─── POST /api/connections/apply  — public ───────────────────────────────────
router.post('/apply', (req, res) => {
  try {
    const {
      applicant_name, phone, email, address, district,
      connection_type, load_required, purpose,
      id_proof_type, id_proof_number
    } = req.body;

    if (!applicant_name || !phone || !address || !district || !connection_type || !load_required) {
      return res.status(400).json({
        success: false,
        message: 'applicant_name, phone, address, district, connection_type and load_required are required'
      });
    }

    const validTypes = ['domestic', 'commercial', 'industrial', 'agricultural'];
    if (!validTypes.includes(connection_type)) {
      return res.status(400).json({
        success: false,
        message: `connection_type must be one of: ${validTypes.join(', ')}`
      });
    }

    const appNo = genAppNo();

    db.prepare(`
      INSERT INTO connection_requests
        (application_number, applicant_name, phone, email, address, district,
         connection_type, load_required, purpose, id_proof_type, id_proof_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      appNo, applicant_name, phone, email || null, address, district,
      connection_type, parseFloat(load_required),
      purpose || null, id_proof_type || null, id_proof_number || null
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted. You will receive an SMS acknowledgement.',
      data: { application_number: appNo }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/connections/track/:application_number  — public ────────────────
router.get('/track/:application_number', (req, res) => {
  const request = db.prepare(
    'SELECT * FROM connection_requests WHERE application_number = ?'
  ).get(req.params.application_number);
  if (!request) return res.status(404).json({ success: false, message: 'Application not found' });
  res.json({ success: true, data: request });
});

// ─── GET /api/connections  (admin) ──────────────────────────────────────────
router.get('/', authenticate, isAdmin, (req, res) => {
  const { status, district, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = []; let params = [];

  if (status)   { where.push('status = ?');   params.push(status); }
  if (district) { where.push('district = ?'); params.push(district); }

  const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) AS count FROM connection_requests ${whereStr}`).get(...params);
  const rows  = db.prepare(
    `SELECT * FROM connection_requests ${whereStr} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({ success: true, total: total.count, page: parseInt(page), data: rows });
});

// ─── PUT /api/connections/:id/approve  (admin) ──────────────────────────────
router.put('/:id/approve', authenticate, isAdmin, (req, res) => {
  try {
    const { remarks } = req.body;
    const req_ = db.prepare('SELECT * FROM connection_requests WHERE id = ?').get(req.params.id);
    if (!req_) return res.status(404).json({ success: false, message: 'Application not found' });
    if (req_.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Application is not in pending state' });
    }

    const consumerId = genConsumerId();
    db.prepare(`
      UPDATE connection_requests
      SET status = 'approved', remarks = ?, approved_by = ?,
          approved_at = datetime('now'), consumer_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(remarks || null, req.user.id, consumerId, req.params.id);

    res.json({
      success: true,
      message: 'Connection approved',
      data: { consumer_id: consumerId }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/connections/:id/reject  (admin) ────────────────────────────────
router.put('/:id/reject', authenticate, isAdmin, (req, res) => {
  const { remarks } = req.body;
  const req_ = db.prepare('SELECT id FROM connection_requests WHERE id = ?').get(req.params.id);
  if (!req_) return res.status(404).json({ success: false, message: 'Application not found' });

  db.prepare(`
    UPDATE connection_requests
    SET status = 'rejected', remarks = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(remarks || null, req.params.id);

  res.json({ success: true, message: 'Application rejected' });
});

// ─── GET /api/connections/districts  — helper for frontend dropdowns ─────────
router.get('/districts/list', (_req, res) => {
  res.json({ success: true, data: DISTRICTS });
});

module.exports = router;

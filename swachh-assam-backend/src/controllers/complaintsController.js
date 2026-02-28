const { dbRun, dbGet, dbAll } = require('../config/database');
const { generateComplaintRef, sendSMS } = require('../utils/helpers');

// POST /api/complaints — Submit a new complaint
async function submitComplaint(req, res, next) {
  try {
    const { user_name, mobile, ward, issue_type, description, latitude, longitude } = req.body;

    // Basic validation
    if (!user_name || !mobile || !ward || !issue_type || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const refNum = generateComplaintRef();
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // Auto-priority based on issue type
    const urgentTypes = ['Dead Animal on Road', 'Burning of Waste'];
    const highTypes = ['Overflowing Public Bin', 'Illegal Dumping / Littering'];
    let priority = 'normal';
    if (urgentTypes.includes(issue_type)) priority = 'urgent';
    else if (highTypes.includes(issue_type)) priority = 'high';

    const result = await dbRun(
      `INSERT INTO complaints 
       (reference_number, user_name, mobile, ward, issue_type, description, image_path, latitude, longitude, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [refNum, user_name.trim(), mobile.trim(), ward, issue_type, description.trim(), imagePath, latitude || null, longitude || null, priority]
    );

    // Log initial history
    await dbRun(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, note)
       VALUES (?, null, 'pending', 'Complaint submitted by citizen')`,
      [result.lastID]
    );

    // Send SMS confirmation (mock)
    await sendSMS(mobile, `Dear ${user_name}, your complaint has been registered. Reference: ${refNum}. We will resolve it within 24 hours. - Swachh Assam`);

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        reference_number: refNum,
        complaint_id: result.lastID,
        status: 'pending',
        priority,
        estimated_resolution: '24 hours',
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints/track/:refNum — Track complaint status
async function trackComplaint(req, res, next) {
  try {
    const { refNum } = req.params;
    const complaint = await dbGet(
      `SELECT c.*, u.name as officer_name 
       FROM complaints c 
       LEFT JOIN users u ON c.assigned_officer_id = u.id 
       WHERE c.reference_number = ?`,
      [refNum.toUpperCase()]
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found. Check your reference number.' });
    }

    const history = await dbAll(
      `SELECT ch.*, u.name as changed_by_name 
       FROM complaint_history ch 
       LEFT JOIN users u ON ch.changed_by = u.id 
       WHERE ch.complaint_id = ? 
       ORDER BY ch.created_at ASC`,
      [complaint.id]
    );

    return res.json({
      success: true,
      data: {
        reference_number: complaint.reference_number,
        issue_type: complaint.issue_type,
        ward: complaint.ward,
        status: complaint.status,
        priority: complaint.priority,
        description: complaint.description,
        submitted_on: complaint.created_at,
        resolved_on: complaint.resolved_at || null,
        resolution_note: complaint.resolution_note || null,
        assigned_officer: complaint.officer_name || null,
        image: complaint.image_path || null,
        history: history.map(h => ({
          status: h.new_status,
          note: h.note,
          changed_by: h.changed_by_name || 'System',
          timestamp: h.created_at,
        })),
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints — List complaints (admin/officer)
async function listComplaints(req, res, next) {
  try {
    const { status, ward, priority, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = [];
    let params = [];

    // Field officers can only see their ward
    if (req.user.role === 'field_officer' && req.user.ward) {
      where.push('c.ward = ?');
      params.push(req.user.ward);
    }

    if (status) { where.push('c.status = ?'); params.push(status); }
    if (ward && req.user.role === 'admin') { where.push('c.ward = ?'); params.push(ward); }
    if (priority) { where.push('c.priority = ?'); params.push(priority); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const total = await dbGet(`SELECT COUNT(*) as cnt FROM complaints c ${whereClause}`, params);
    const complaints = await dbAll(
      `SELECT c.id, c.reference_number, c.user_name, c.mobile, c.ward, c.issue_type, 
              c.status, c.priority, c.created_at, c.updated_at, u.name as officer_name
       FROM complaints c
       LEFT JOIN users u ON c.assigned_officer_id = u.id
       ${whereClause}
       ORDER BY 
         CASE c.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
         c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return res.json({
      success: true,
      data: complaints,
      pagination: {
        total: total.cnt,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total.cnt / limit),
      }
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/complaints/:id/status — Update complaint status (admin/officer)
async function updateComplaintStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note, assigned_officer_id } = req.body;

    const validStatuses = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const complaint = await dbGet('SELECT * FROM complaints WHERE id = ?', [id]);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    const updates = { status, updated_at: new Date().toISOString() };
    if (assigned_officer_id) updates.assigned_officer_id = assigned_officer_id;
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
      updates.resolution_note = note || 'Issue resolved by field team';
    }

    await dbRun(
      `UPDATE complaints SET status = ?, assigned_officer_id = COALESCE(?, assigned_officer_id),
       resolved_at = ?, resolution_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, assigned_officer_id || null, updates.resolved_at || null, updates.resolution_note || null, id]
    );

    await dbRun(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, note)
       VALUES (?, ?, ?, ?, ?)`,
      [id, complaint.status, status, req.user.id, note || null]
    );

    // Send SMS on resolution
    if (status === 'resolved') {
      await sendSMS(complaint.mobile,
        `Dear ${complaint.user_name}, your complaint ${complaint.reference_number} has been resolved. Thank you for helping us keep Assam clean! - Swachh Assam`
      );
    }

    return res.json({ success: true, message: 'Complaint status updated', data: { id, status } });
  } catch (err) {
    next(err);
  }
}

// GET /api/complaints/stats — Complaint statistics (admin)
async function getComplaintStats(req, res, next) {
  try {
    const stats = await dbGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN priority = 'urgent' AND status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as urgent_open,
        SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) as today
      FROM complaints
    `);

    const byWard = await dbAll(`
      SELECT ward, COUNT(*) as total,
             SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM complaints GROUP BY ward ORDER BY total DESC LIMIT 10
    `);

    const byType = await dbAll(`
      SELECT issue_type, COUNT(*) as total
      FROM complaints GROUP BY issue_type ORDER BY total DESC
    `);

    return res.json({ success: true, data: { summary: stats, by_ward: byWard, by_type: byType } });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitComplaint, trackComplaint, listComplaints, updateComplaintStatus, getComplaintStats };

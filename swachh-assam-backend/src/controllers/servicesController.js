const { dbRun, dbGet, dbAll } = require('../config/database');
const { generateAuditRef } = require('../utils/helpers');

// ── SWACHH POINTS ──────────────────────────────────────────────────

// GET /api/points — Get user's points & history
async function getMyPoints(req, res, next) {
  try {
    const user = await dbGet('SELECT id, name, swachh_points FROM users WHERE id = ?', [req.user.id]);
    const history = await dbAll(
      'SELECT * FROM points_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    return res.json({ success: true, data: { points: user.swachh_points, history } });
  } catch (err) {
    next(err);
  }
}

// POST /api/points/award — Award points (admin)
async function awardPoints(req, res, next) {
  try {
    const { user_id, points, reason, reference_id } = req.body;
    if (!user_id || !points || !reason) {
      return res.status(400).json({ success: false, message: 'user_id, points and reason are required' });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newBalance = user.swachh_points + parseInt(points);
    await dbRun('UPDATE users SET swachh_points = ? WHERE id = ?', [newBalance, user_id]);
    await dbRun(
      'INSERT INTO points_transactions (user_id, points, type, reason, reference_id, balance_after) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, points, 'earn', reason, reference_id || null, newBalance]
    );

    return res.json({ success: true, message: `${points} points awarded`, data: { new_balance: newBalance } });
  } catch (err) {
    next(err);
  }
}

// POST /api/points/redeem — Redeem points (authenticated citizen)
async function redeemPoints(req, res, next) {
  try {
    const { points, reason } = req.body;
    if (!points || points <= 0) return res.status(400).json({ success: false, message: 'Invalid points amount' });

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (user.swachh_points < points) {
      return res.status(400).json({ success: false, message: `Insufficient points. You have ${user.swachh_points} points.` });
    }

    const newBalance = user.swachh_points - parseInt(points);
    await dbRun('UPDATE users SET swachh_points = ? WHERE id = ?', [newBalance, req.user.id]);
    await dbRun(
      'INSERT INTO points_transactions (user_id, points, type, reason, balance_after) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, points, 'redeem', reason || 'Points redemption', newBalance]
    );

    return res.json({ success: true, message: 'Points redeemed successfully', data: { redeemed: points, new_balance: newBalance } });
  } catch (err) {
    next(err);
  }
}

// ── NOTICES ─────────────────────────────────────────────────────────

// GET /api/notices — Active notices (public)
async function getNotices(req, res, next) {
  try {
    const { ward } = req.query;
    const notices = await dbAll(
      `SELECT * FROM notices 
       WHERE is_active = 1 
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
         AND (ward IS NULL OR ward = ? OR ? IS NULL)
       ORDER BY notice_type DESC, created_at DESC LIMIT 10`,
      [ward || null, ward || null]
    );
    return res.json({ success: true, data: notices });
  } catch (err) {
    next(err);
  }
}

// POST /api/notices — Create notice (admin)
async function createNotice(req, res, next) {
  try {
    const { title, body, notice_type, ward, expires_at } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, message: 'title and body required' });

    const result = await dbRun(
      'INSERT INTO notices (title, body, notice_type, ward, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, body, notice_type || 'info', ward || null, expires_at || null, req.user.id]
    );
    return res.status(201).json({ success: true, message: 'Notice created', data: { id: result.lastID } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/notices/:id (admin)
async function deleteNotice(req, res, next) {
  try {
    await dbRun('UPDATE notices SET is_active = 0 WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Notice deactivated' });
  } catch (err) {
    next(err);
  }
}

// ── WASTE AUDIT ──────────────────────────────────────────────────────

// POST /api/audit/request
async function requestAudit(req, res, next) {
  try {
    const { society_name, contact_name, mobile, email, ward, address, household_count, preferred_date } = req.body;
    if (!society_name || !contact_name || !mobile || !ward || !address) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const refNum = generateAuditRef();
    await dbRun(
      `INSERT INTO audit_requests (reference_number, society_name, contact_name, mobile, email, ward, address, household_count, preferred_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [refNum, society_name, contact_name, mobile, email || null, ward, address, household_count || null, preferred_date || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Waste audit requested successfully',
      data: { reference_number: refNum }
    });
  } catch (err) {
    next(err);
  }
}

// ── COMPOSTING REGISTRATION ──────────────────────────────────────────

// POST /api/composting/register
async function registerComposting(req, res, next) {
  try {
    const { user_name, mobile, ward, address, household_size, has_garden, kit_requested } = req.body;
    if (!user_name || !mobile || !ward || !address) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    await dbRun(
      `INSERT INTO composting_registrations (user_name, mobile, ward, address, household_size, has_garden, kit_requested)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_name, mobile, ward, address, household_size || null, has_garden ? 1 : 0, kit_requested ? 1 : 0]
    );

    return res.status(201).json({
      success: true,
      message: 'Successfully registered for community composting programme. We will contact you within 3 working days.',
    });
  } catch (err) {
    next(err);
  }
}

// ── PORTAL STATS (for homepage stats strip) ──────────────────────────

// GET /api/stats
async function getPortalStats(req, res, next) {
  try {
    const stats = await dbGet(`
      SELECT 
        (SELECT COUNT(DISTINCT ward) FROM collection_schedules WHERE is_active = 1) as wards_covered,
        (SELECT COUNT(*) FROM complaints WHERE status = 'resolved') as complaints_resolved,
        (SELECT COUNT(*) FROM composting_registrations WHERE status IN ('active','kit_dispatched')) as composting_members,
        (SELECT COUNT(*) FROM bulk_pickups WHERE status = 'completed') as bulk_pickups_completed
    `);

    return res.json({
      success: true,
      data: {
        wards_covered_pct: 92,
        tonnes_collected_per_day: 4.2,
        complaints_resolved: stats.complaints_resolved || 18000,
        waste_recycled_pct: 68,
        composting_members: stats.composting_members,
        bulk_pickups_completed: stats.bulk_pickups_completed,
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/wards
async function getWards(req, res) {
  const wards = [
    { id: 'ward_1', name: 'Ward 1 – Panbazar', zone: 'Zone A' },
    { id: 'ward_2', name: 'Ward 2 – Dispur', zone: 'Zone A' },
    { id: 'ward_3', name: 'Ward 3 – Chandmari', zone: 'Zone B' },
    { id: 'ward_4', name: 'Ward 4 – Sixmile', zone: 'Zone B' },
    { id: 'ward_5', name: 'Ward 5 – Hatigaon', zone: 'Zone C' },
    { id: 'ward_6', name: 'Ward 6 – Beltola', zone: 'Zone C' },
  ];
  return res.json({ success: true, data: wards });
}

module.exports = {
  getMyPoints, awardPoints, redeemPoints,
  getNotices, createNotice, deleteNotice,
  requestAudit, registerComposting,
  getPortalStats, getWards,
};

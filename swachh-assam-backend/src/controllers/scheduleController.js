const { dbRun, dbGet, dbAll } = require('../config/database');
const { DAY_NAMES } = require('../utils/helpers');

// GET /api/schedule — Get weekly schedule
async function getSchedule(req, res, next) {
  try {
    const { ward, zone } = req.query;

    let where = ['s.is_active = 1'];
    let params = [];
    if (ward) { where.push('s.ward = ?'); params.push(ward); }
    if (zone) { where.push('s.zone = ?'); params.push(zone); }

    const schedules = await dbAll(
      `SELECT * FROM collection_schedules WHERE ${where.join(' AND ')} ORDER BY ward, day_of_week`,
      params
    );

    // Group by ward
    const grouped = {};
    for (const s of schedules) {
      if (!grouped[s.ward]) grouped[s.ward] = { ward: s.ward, zone: s.zone, days: [] };
      grouped[s.ward].days.push({
        day_number: s.day_of_week,
        day_name: DAY_NAMES[s.day_of_week],
        waste_types: s.waste_types.split(',').map(t => t.trim()),
        shift: s.shift,
        timing: s.timing,
        vehicle_number: s.vehicle_number,
      });
    }

    // Check for overrides today / upcoming week
    const overrides = await dbAll(
      `SELECT * FROM schedule_overrides 
       WHERE override_date >= date('now') AND override_date <= date('now', '+7 days')
       ORDER BY override_date ASC`
    );

    return res.json({
      success: true,
      data: {
        schedules: Object.values(grouped),
        upcoming_overrides: overrides,
        days: DAY_NAMES,
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/schedule/today — What gets collected today
async function getTodaySchedule(req, res, next) {
  try {
    const { ward } = req.query;
    const dayOfWeek = new Date().getDay();

    let where = ['day_of_week = ?', 'is_active = 1'];
    let params = [dayOfWeek];
    if (ward) { where.push('ward = ?'); params.push(ward); }

    const schedules = await dbAll(
      `SELECT * FROM collection_schedules WHERE ${where.join(' AND ')}`,
      params
    );

    // Check for override today
    const override = await dbGet(
      `SELECT * FROM schedule_overrides WHERE override_date = date('now') AND (ward = ? OR ward IS NULL)`,
      [ward || '']
    );

    return res.json({
      success: true,
      data: {
        day: DAY_NAMES[dayOfWeek],
        schedules: schedules.map(s => ({
          ward: s.ward,
          zone: s.zone,
          waste_types: s.waste_types.split(',').map(t => t.trim()),
          timing: s.timing,
          vehicle: s.vehicle_number,
        })),
        override: override || null,
      }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/schedule — Add schedule (admin)
async function createSchedule(req, res, next) {
  try {
    const { ward, zone, day_of_week, waste_types, shift, timing, vehicle_number, driver_name } = req.body;
    if (!ward || !zone || day_of_week === undefined || !waste_types) {
      return res.status(400).json({ success: false, message: 'ward, zone, day_of_week and waste_types are required' });
    }

    const result = await dbRun(
      `INSERT INTO collection_schedules (ward, zone, day_of_week, waste_types, shift, timing, vehicle_number, driver_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ward, zone, day_of_week, Array.isArray(waste_types) ? waste_types.join(', ') : waste_types,
       shift || 'morning', timing || '06:30 AM - 09:30 AM', vehicle_number || null, driver_name || null]
    );

    return res.status(201).json({ success: true, message: 'Schedule created', data: { id: result.lastID } });
  } catch (err) {
    next(err);
  }
}

// POST /api/schedule/override — Add schedule override / holiday notice (admin)
async function addOverride(req, res, next) {
  try {
    const { override_date, ward, reason, rescheduled_to, notice_text } = req.body;
    if (!override_date || !reason) {
      return res.status(400).json({ success: false, message: 'override_date and reason are required' });
    }

    await dbRun(
      `INSERT INTO schedule_overrides (override_date, ward, reason, rescheduled_to, notice_text)
       VALUES (?, ?, ?, ?, ?)`,
      [override_date, ward || null, reason, rescheduled_to || null, notice_text || null]
    );

    return res.status(201).json({ success: true, message: 'Override added' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSchedule, getTodaySchedule, createSchedule, addOverride };

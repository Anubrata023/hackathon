const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbRun, dbGet } = require('../config/database');

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, mobile, email, password, ward } = req.body;
    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'name, mobile and password are required' });
    }

    const existing = await dbGet('SELECT id FROM users WHERE mobile = ?', [mobile]);
    if (existing) return res.status(409).json({ success: false, message: 'Mobile number already registered' });

    const password_hash = await bcrypt.hash(password, 12);
    const result = await dbRun(
      'INSERT INTO users (name, mobile, email, password_hash, ward) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), mobile.trim(), email || null, password_hash, ward || null]
    );

    const token = signToken(result.lastID);
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { token, user: { id: result.lastID, name, mobile, email, role: 'citizen', swachh_points: 0 } }
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: 'mobile and password are required' });
    }

    const user = await dbGet('SELECT * FROM users WHERE mobile = ? AND is_active = 1', [mobile]);
    if (!user || !user.password_hash) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken(user.id);
    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, mobile: user.mobile, email: user.email, role: user.role, swachh_points: user.swachh_points, ward: user.ward }
      }
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  const { id, name, mobile, email, role, swachh_points, ward, created_at } = req.user;
  return res.json({ success: true, data: { id, name, mobile, email, role, swachh_points, ward, created_at } });
}

// POST /api/auth/change-password
async function changePassword(req, res, next) {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({ success: false, message: 'old_password and new_password required' });
    }
    const valid = await bcrypt.compare(old_password, req.user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Old password is incorrect' });

    const password_hash = await bcrypt.hash(new_password, 12);
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, req.user.id]);
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, changePassword };

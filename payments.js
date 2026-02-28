const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database');
const { authenticate } = require('../middleware/auth');

function generateConsumerID() {
  const districts = ['AS', 'KM', 'NP', 'JR', 'DB', 'BG', 'NG', 'GP'];
  const prefix = districts[Math.floor(Math.random() * districts.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}-${suffix}`;
}

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// ─── POST /api/auth/register ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, address, district } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'name, email, phone and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(email, phone);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or phone already registered' });
    }

    const hashed     = await bcrypt.hash(password, 10);
    const consumerId = generateConsumerID();

    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password, address, district, consumer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, email.toLowerCase(), phone, hashed, address || null, district || null, consumerId);

    const token = signToken(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { token, consumer_id: consumerId, name, email }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, phone, consumer_id, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    let user;
    if (consumer_id) {
      user = db.prepare('SELECT * FROM users WHERE consumer_id = ?').get(consumer_id);
    } else if (email) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    } else if (phone) {
      user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    } else {
      return res.status(400).json({ success: false, message: 'Provide email, phone or consumer_id' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact APDCL.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id, name: user.name, email: user.email,
          phone: user.phone, consumer_id: user.consumer_id,
          role: user.role, district: user.district, address: user.address
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/auth/profile ───────────────────────────────────────────────────
router.get('/profile', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, name, email, phone, consumer_id, address, district, role, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  res.json({ success: true, data: user });
});

// ─── PUT /api/auth/profile ───────────────────────────────────────────────────
router.put('/profile', authenticate, (req, res) => {
  try {
    const { name, phone, address, district } = req.body;
    db.prepare(`
      UPDATE users SET name = ?, phone = ?, address = ?, district = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, phone, address, district, req.user.id);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/auth/change-password ──────────────────────────────────────────
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Both current and new password required' });
    }

    const row   = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    const match = await bcrypt.compare(current_password, row.password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(new_password, 10);
    db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, req.user.id);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

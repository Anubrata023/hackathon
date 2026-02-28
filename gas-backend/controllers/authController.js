const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const { v4: uuid }   = require('uuid');
const { getDB }      = require('../database/db');

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = (req, res) => {
  const { name, email, phone, password, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email and password are required' });
  }

  const db       = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const id            = uuid();
  const password_hash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, email, phone || null, password_hash, address || null);

  const token = jwt.sign(
    { id, email, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.status(201).json({ success: true, message: 'Registered successfully', token });
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'email and password are required' });
  }

  const db   = getDB();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const { password_hash, ...profile } = user;
  res.json({ success: true, token, user: profile });
};

// ── Get Profile ───────────────────────────────────────────────────────────────
exports.getProfile = (req, res) => {
  const db   = getDB();
  const user = db.prepare(
    'SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
};

// ── Update Profile ────────────────────────────────────────────────────────────
exports.updateProfile = (req, res) => {
  const { name, phone, address } = req.body;
  const db = getDB();
  db.prepare('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?')
    .run(name, phone || null, address || null, req.user.id);
  res.json({ success: true, message: 'Profile updated successfully' });
};

// ── Change Password ───────────────────────────────────────────────────────────
exports.changePassword = (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
  }

  const db   = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ success: true, message: 'Password changed successfully' });
};

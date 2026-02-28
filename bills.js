const jwt = require('jsonwebtoken');
const db  = require('../database');

const authenticate = (req, res, next) => {
  const auth  = req.headers['authorization'];
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = db.prepare(
      'SELECT id, name, email, phone, role, consumer_id, district, address, is_active FROM users WHERE id = ?'
    ).get(decoded.id);

    if (!user)          return res.status(401).json({ success: false, message: 'User not found' });
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account deactivated' });

    req.user = user;
    next();
  } catch {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, isAdmin };

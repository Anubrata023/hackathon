const jwt = require('jsonwebtoken');

/**
 * Verifies the Bearer JWT in Authorization header.
 * Attaches decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;        // { id, email, full_name }
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid token.';
    return res.status(401).json({ success: false, message: msg });
  }
};

module.exports = { authenticate };

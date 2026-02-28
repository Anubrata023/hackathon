/**
 * Wraps async route handlers — eliminates repetitive try/catch.
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Global error handler — must be registered last in Express.
 */
const errorHandler = (err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    const field = err.message.includes('email') ? 'email' : 'phone_number';
    return res.status(409).json({ success: false, message: `${field} is already registered.` });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { asyncHandler, errorHandler };

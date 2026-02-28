/**
 * Generic field-presence validator middleware factory.
 * Usage: validate(['email', 'password'])
 */
function validate(fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => !req.body[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { validate };

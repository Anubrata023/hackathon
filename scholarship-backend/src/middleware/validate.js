// src/middleware/validate.js
// Joi schema validation middleware

const { AppError } = require('./errorHandler');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: false,
  });

  if (error) {
    const details = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors: details });
  }

  req.body = value;
  next();
};

module.exports = validate;

// src/validators/notice.validator.js
const Joi = require('joi');

exports.create = Joi.object({
  title:         Joi.string().min(5).max(200).required(),
  body:          Joi.string().min(10).required(),
  tag:           Joi.string().valid('DEADLINE','NOTICE','RESULT','NEW','ALERT','INFO').required(),
  issuedBy:      Joi.string().required(),
  publishedAt:   Joi.date().iso().optional(),
  expiresAt:     Joi.date().iso().optional().allow(null),
  isPinned:      Joi.boolean().default(false),
  attachmentUrl: Joi.string().uri().optional().allow('', null),
});

exports.update = exports.create.fork(
  Object.keys(exports.create.describe().keys),
  (schema) => schema.optional()
);

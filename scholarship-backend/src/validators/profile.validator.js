// src/validators/profile.validator.js
const Joi = require('joi');

const GENDERS       = ['MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY'];
const CATEGORIES    = ['GENERAL','OBC','SC','ST','EWS','MINORITY'];
const INCOME_GROUPS = ['BELOW_1L','BELOW_2L','BELOW_3_5L','BELOW_8L','ABOVE_8L'];
const ACAD_LEVELS   = ['PRE_MATRIC','MATRIC','POST_MATRIC','GRADUATION','POST_GRADUATION','DIPLOMA','VOCATIONAL','PHD'];

exports.create = Joi.object({
  firstName:       Joi.string().min(2).max(50).required(),
  lastName:        Joi.string().min(2).max(50).required(),
  dob:             Joi.date().iso().max('now').required(),
  gender:          Joi.string().valid(...GENDERS).required(),
  category:        Joi.string().valid(...CATEGORIES).required(),
  incomeGroup:     Joi.string().valid(...INCOME_GROUPS).required(),
  academicLevel:   Joi.string().valid(...ACAD_LEVELS).required(),
  institution:     Joi.string().min(3).max(200).required(),
  institutionCode: Joi.string().optional().allow('', null),
  course:          Joi.string().min(2).max(100).required(),
  yearOfStudy:     Joi.number().integer().min(1).max(10).required(),
  percentage:      Joi.number().min(0).max(100).optional().allow(null),
  rollNumber:      Joi.string().optional().allow('', null),
  district:        Joi.string().required(),
  ward:            Joi.string().optional().allow('', null),
  address:         Joi.string().min(10).max(300).required(),
  pincode:         Joi.string().pattern(/^\d{6}$/).required().messages({ 'string.pattern.base': 'Enter a valid 6-digit PIN code' }),
  isMinority:      Joi.boolean().default(false),
  isDisabled:      Joi.boolean().default(false),
  disabilityPct:   Joi.number().integer().min(1).max(100).optional().allow(null),
});

exports.update = exports.create.fork(
  Object.keys(exports.create.describe().keys),
  (schema) => schema.optional()
);

exports.updateBank = Joi.object({
  bankAccountNo: Joi.string().pattern(/^\d{9,18}$/).required().messages({
    'string.pattern.base': 'Enter a valid bank account number (9-18 digits)',
  }),
  bankName:      Joi.string().required(),
  bankIFSC:      Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required().messages({
    'string.pattern.base': 'Enter a valid IFSC code (e.g. SBIN0001234)',
  }),
  bankBranch:    Joi.string().optional().allow('', null),
});

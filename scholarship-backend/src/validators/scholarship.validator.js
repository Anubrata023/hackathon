// src/validators/scholarship.validator.js
const Joi = require('joi');

const CATEGORIES     = ['GENERAL','OBC','SC','ST','EWS','MINORITY'];
const INCOME_GROUPS  = ['BELOW_1L','BELOW_2L','BELOW_3_5L','BELOW_8L','ABOVE_8L'];
const ACADEMIC_LVLS  = ['PRE_MATRIC','MATRIC','POST_MATRIC','GRADUATION','POST_GRADUATION','DIPLOMA','VOCATIONAL','PHD'];
const STATUS_VALS    = ['DRAFT','ACTIVE','CLOSING_SOON','CLOSED','ARCHIVED'];
const DOC_TYPES      = ['MARKSHEET','INCOME_CERTIFICATE','CASTE_CERTIFICATE','AADHAAR','PHOTO','BANK_PASSBOOK','DOMICILE','DISABILITY_CERTIFICATE','MINORITY_CERTIFICATE','OTHER'];

exports.create = Joi.object({
  name:                    Joi.string().min(5).max(200).required(),
  shortName:               Joi.string().max(50).optional(),
  issuer:                  Joi.string().required(),
  description:             Joi.string().min(20).required(),
  status:                  Joi.string().valid(...STATUS_VALS).default('DRAFT'),
  isFeatured:              Joi.boolean().default(false),
  eligibleCategories:      Joi.array().items(Joi.string().valid(...CATEGORIES)).default([]),
  eligibleIncomeGroups:    Joi.array().items(Joi.string().valid(...INCOME_GROUPS)).default([]),
  eligibleAcademicLevels:  Joi.array().items(Joi.string().valid(...ACADEMIC_LVLS)).default([]),
  minPercentage:           Joi.number().min(0).max(100).optional().allow(null),
  minAge:                  Joi.number().integer().min(5).max(40).optional().allow(null),
  maxAge:                  Joi.number().integer().min(5).max(40).optional().allow(null),
  requiresDistrict:        Joi.boolean().default(true),
  onlyForGirls:            Joi.boolean().default(false),
  onlyForMinority:         Joi.boolean().default(false),
  onlyForDisabled:         Joi.boolean().default(false),
  amountPerYear:           Joi.number().positive().required(),
  amountFrequency:         Joi.string().valid('yearly','monthly','one-time').default('yearly'),
  totalSeats:              Joi.number().integer().positive().optional().allow(null),
  seatsRemaining:          Joi.number().integer().min(0).optional().allow(null),
  applicationStartDate:    Joi.date().iso().required(),
  applicationEndDate:      Joi.date().iso().greater(Joi.ref('applicationStartDate')).required(),
  academicYear:            Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  requiredDocuments:       Joi.array().items(Joi.string().valid(...DOC_TYPES)).required(),
  externalUrl:             Joi.string().uri().optional().allow('', null),
  nspSchemeCode:           Joi.string().optional().allow('', null),
  iconType:                Joi.string().optional().allow('', null),
});

exports.update = exports.create.fork(
  Object.keys(exports.create.describe().keys),
  (schema) => schema.optional()
);

exports.updateStatus = Joi.object({
  status: Joi.string().valid(...STATUS_VALS).required(),
});

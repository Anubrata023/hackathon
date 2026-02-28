// src/validators/eligibility.validator.js
const Joi = require('joi');

exports.check = Joi.object({
  gender:        Joi.string().valid('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY').required(),
  dob:           Joi.date().iso().max('now').optional().allow(null),
  category:      Joi.string().valid('GENERAL','OBC','SC','ST','EWS','MINORITY').required(),
  incomeGroup:   Joi.string().valid('BELOW_1L','BELOW_2L','BELOW_3_5L','BELOW_8L','ABOVE_8L').required(),
  academicLevel: Joi.string().valid('PRE_MATRIC','MATRIC','POST_MATRIC','GRADUATION','POST_GRADUATION','DIPLOMA','VOCATIONAL','PHD').required(),
  district:      Joi.string().optional().default('Kamrup Metropolitan'),
  percentage:    Joi.number().min(0).max(100).optional().allow(null),
  isMinority:    Joi.boolean().default(false),
  isDisabled:    Joi.boolean().default(false),
});

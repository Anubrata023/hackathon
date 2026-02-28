// src/validators/application.validator.js
const Joi = require('joi');

const APP_STATUSES = [
  'DRAFT','SUBMITTED','UNDER_REVIEW','INSTITUTION_VERIFIED',
  'PENDING_APPROVAL','APPROVED','DISBURSED','REJECTED','CANCELLED','RENEWAL_DUE',
];

exports.create = Joi.object({
  scholarshipId: Joi.string().uuid().required(),
});

exports.update = Joi.object({
  documentIds:    Joi.array().items(Joi.string().uuid()).optional(),
  studentRemarks: Joi.string().max(500).optional().allow('', null),
  formData:       Joi.object().optional(),
});

exports.verify = Joi.object({
  remarks: Joi.string().max(500).optional().allow('', null),
});

exports.changeStatus = Joi.object({
  status:  Joi.string().valid(...APP_STATUSES).required(),
  remarks: Joi.string().max(500).optional().allow('', null),
});

exports.bulkAction = Joi.object({
  applicationIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  remarks:        Joi.string().max(500).optional(),
});

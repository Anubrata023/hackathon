// src/controllers/eligibility.controller.js
// AI-assisted eligibility checker — matches user inputs to scholarship criteria

const { v4: uuidv4 } = require('uuid');
const prisma  = require('../config/database').prisma;
const { AppError } = require('../middleware/errorHandler');
const eligibilityService = require('../services/eligibility.service');

/**
 * POST /eligibility/check
 * Body: { gender, dob, category, incomeGroup, academicLevel, district, percentage, isMinority, isDisabled }
 */
exports.checkEligibility = async (req, res, next) => {
  try {
    const inputs = req.body;
    const sessionId = uuidv4();

    // Fetch all active scholarships
    const scholarships = await prisma.scholarship.findMany({
      where: { status: { in: ['ACTIVE', 'CLOSING_SOON'] } },
    });

    // Score each scholarship against user inputs
    const results = scholarships.map(s => {
      const score = eligibilityService.scoreScholarship(inputs, s);
      return { scholarship: s, ...score };
    });

    // Sort: fully eligible first, then partial, then ineligible
    const matched = results
      .filter(r => r.eligible || r.partiallyEligible)
      .sort((a, b) => b.score - a.score);

    const ineligible = results.filter(r => !r.eligible && !r.partiallyEligible);

    // Persist the check for analytics
    await prisma.eligibilityCheck.create({
      data: {
        sessionId,
        inputData:    inputs,
        matchedSchemas: matched.map(m => ({ id: m.scholarship.id, score: m.score })),
      },
    });

    res.json({
      success: true,
      sessionId,
      data: {
        eligible:    matched.filter(r => r.eligible).map(r => ({ ...r.scholarship, score: r.score, reasons: r.reasons })),
        partial:     matched.filter(r => r.partiallyEligible).map(r => ({ ...r.scholarship, score: r.score, missingCriteria: r.missingCriteria })),
        ineligible:  ineligible.slice(0, 5).map(r => ({ id: r.scholarship.id, name: r.scholarship.name, reason: r.reason })),
        totalChecked: scholarships.length,
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /eligibility/result/:sessionId
 */
exports.getResult = async (req, res, next) => {
  try {
    const check = await prisma.eligibilityCheck.findFirst({
      where: { sessionId: req.params.sessionId },
      orderBy: { createdAt: 'desc' },
    });
    if (!check) throw new AppError('Eligibility check session not found', 404);
    res.json({ success: true, data: check });
  } catch (err) { next(err); }
};

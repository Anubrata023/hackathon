// src/controllers/scholarship.controller.js

const prisma   = require('../config/database').prisma;
const slugify  = require('slugify');
const { AppError } = require('../middleware/errorHandler');
const auditService = require('../services/audit.service');
const eligibilityService = require('../services/eligibility.service');

// ─── Helpers ──────────────────────────────────────────────
function buildWhereClause(query) {
  const { status, category, level, q, featured } = query;
  const where = {};

  if (status)   where.status   = status;
  if (featured) where.isFeatured = featured === 'true';
  if (category) where.eligibleCategories = { has: category };
  if (level)    where.eligibleAcademicLevels = { has: level };
  if (q) {
    where.OR = [
      { name:    { contains: q, mode: 'insensitive' } },
      { issuer:  { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  return where;
}

// ─── Controllers ─────────────────────────────────────────

/**
 * GET /scholarships
 * Public: list with filters, search, pagination.
 */
exports.listScholarships = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(50, parseInt(req.query.limit || '12'));
    const skip  = (page - 1) * limit;

    const where = buildWhereClause(req.query);

    const [scholarships, total] = await Promise.all([
      prisma.scholarship.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isFeatured: 'desc' },
          { applicationEndDate: 'asc' },
        ],
        select: {
          id: true, slug: true, name: true, shortName: true,
          issuer: true, status: true, isFeatured: true,
          amountPerYear: true, amountFrequency: true,
          eligibleCategories: true, eligibleAcademicLevels: true,
          applicationStartDate: true, applicationEndDate: true,
          academicYear: true, totalSeats: true, seatsRemaining: true,
          description: true, iconType: true,
        },
      }),
      prisma.scholarship.count({ where }),
    ]);

    res.json({
      success: true,
      data: scholarships,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

/**
 * GET /scholarships/featured
 * Returns the single featured/highlighted scholarship.
 */
exports.getFeaturedScholarship = async (req, res, next) => {
  try {
    const scholarship = await prisma.scholarship.findFirst({
      where: { isFeatured: true, status: 'ACTIVE' },
      orderBy: { applicationEndDate: 'asc' },
    });

    if (!scholarship) {
      // Fall back to the most recently updated active scholarship
      const fallback = await prisma.scholarship.findFirst({
        where:   { status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
      });
      return res.json({ success: true, data: fallback });
    }

    res.json({ success: true, data: scholarship });
  } catch (err) { next(err); }
};

/**
 * GET /scholarships/:slug
 */
exports.getScholarship = async (req, res, next) => {
  try {
    const scholarship = await prisma.scholarship.findUnique({
      where: { slug: req.params.slug },
    });
    if (!scholarship) throw new AppError('Scholarship not found', 404);

    // Enrich with real-time application count
    const applicationCount = await prisma.application.count({
      where: { scholarshipId: scholarship.id },
    });

    res.json({ success: true, data: { ...scholarship, applicationCount } });
  } catch (err) { next(err); }
};

/**
 * GET /scholarships/:slug/application-status
 * Returns the user's application for this scholarship (if any).
 */
exports.getApplicationStatus = async (req, res, next) => {
  try {
    const scholarship = await prisma.scholarship.findUnique({
      where: { slug: req.params.slug },
      select: { id: true },
    });
    if (!scholarship) throw new AppError('Scholarship not found', 404);

    const application = await prisma.application.findFirst({
      where: { userId: req.user.id, scholarshipId: scholarship.id },
      select: { id: true, applicationNo: true, status: true, submittedAt: true },
    });

    res.json({ success: true, data: { hasApplied: !!application, application } });
  } catch (err) { next(err); }
};

/**
 * POST /scholarships
 * Admin: create a new scholarship.
 */
exports.createScholarship = async (req, res, next) => {
  try {
    const { name, ...rest } = req.body;

    let slug = slugify(name, { lower: true, strict: true });
    const existing = await prisma.scholarship.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const scholarship = await prisma.scholarship.create({
      data: { name, slug, ...rest },
    });

    await auditService.log({
      action: 'SCHOLARSHIP_CREATED', userId: req.user.id,
      entityType: 'Scholarship', entityId: scholarship.id, req,
    });

    res.status(201).json({ success: true, data: scholarship });
  } catch (err) { next(err); }
};

/**
 * PUT /scholarships/:id
 * Admin: update a scholarship.
 */
exports.updateScholarship = async (req, res, next) => {
  try {
    const scholarship = await prisma.scholarship.update({
      where: { id: req.params.id },
      data:  req.body,
    });

    await auditService.log({
      action: 'SCHOLARSHIP_UPDATED', userId: req.user.id,
      entityType: 'Scholarship', entityId: scholarship.id, req,
    });

    res.json({ success: true, data: scholarship });
  } catch (err) { next(err); }
};

/**
 * PATCH /scholarships/:id/status
 */
exports.updateScholarshipStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const scholarship = await prisma.scholarship.update({
      where: { id: req.params.id },
      data:  { status },
    });
    res.json({ success: true, data: scholarship });
  } catch (err) { next(err); }
};

/**
 * DELETE /scholarships/:id
 */
exports.deleteScholarship = async (req, res, next) => {
  try {
    await prisma.scholarship.update({
      where: { id: req.params.id },
      data:  { status: 'ARCHIVED' },
    });
    res.json({ success: true, message: 'Scholarship archived' });
  } catch (err) { next(err); }
};

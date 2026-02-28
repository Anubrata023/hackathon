// src/controllers/admin.controller.js
const prisma  = require('../config/database').prisma;
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /admin/stats
 * Dashboard KPIs.
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalApplications,
      approvedApplications,
      pendingApplications,
      totalDisbursed,
      totalStudents,
      totalScholarships,
      recentApplications,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: 'APPROVED' } }),
      prisma.application.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'INSTITUTION_VERIFIED', 'PENDING_APPROVAL'] } } }),
      prisma.disbursement.aggregate({ _sum: { amount: true }, where: { status: 'PROCESSED' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.scholarship.count({ where: { status: { in: ['ACTIVE', 'CLOSING_SOON'] } } }),
      prisma.application.findMany({
        take: 5, orderBy: { updatedAt: 'desc' },
        include: {
          user:        { select: { phone: true } },
          scholarship: { select: { name: true } },
        },
      }),
    ]);

    // Application status breakdown
    const statusBreakdown = await prisma.application.groupBy({
      by: ['status'],
      _count: true,
    });

    // Applications per scholarship
    const perScholarship = await prisma.application.groupBy({
      by: ['scholarshipId'],
      _count: true,
      orderBy: { _count: { scholarshipId: 'desc' } },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        kpis: {
          totalApplications,
          approvedApplications,
          pendingApplications,
          totalDisbursedAmount: totalDisbursed._sum.amount || 0,
          totalStudents,
          activeScholarships: totalScholarships,
        },
        statusBreakdown: statusBreakdown.map(s => ({ status: s.status, count: s._count })),
        recentApplications,
      },
    });
  } catch (err) { next(err); }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { role, q, page = 1, limit = 20 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (role) where.role = role;
    if (q) {
      where.OR = [
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: parseInt(limit),
        select: {
          id: true, phone: true, email: true, role: true,
          isActive: true, lastLoginAt: true, createdAt: true,
          profile: { select: { firstName: true, lastName: true, institution: true } },
          _count:  { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: users, meta: { total } });
  } catch (err) { next(err); }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.params.id },
      include: {
        profile:      { include: { documents: true } },
        applications: { include: { scholarship: { select: { name: true } } } },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    const { passwordHash, ...safe } = user;
    res.json({ success: true, data: safe });
  } catch (err) { next(err); }
};

exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
    res.json({ success: true, data: { id: user.id, role: user.role } });
  } catch (err) { next(err); }
};

exports.blockUser = async (req, res, next) => {
  try {
    const { block } = req.body;
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !block } });
    // Invalidate all sessions
    if (block) await prisma.userSession.deleteMany({ where: { userId: req.params.id } });
    res.json({ success: true, message: `User ${block ? 'blocked' : 'unblocked'}` });
  } catch (err) { next(err); }
};

exports.applicationReport = async (req, res, next) => {
  try {
    const { year } = req.query;
    const where = year ? { academicYear: year } : {};

    const breakdown = await prisma.application.groupBy({
      by: ['status', 'academicYear'],
      _count: true,
      where,
    });

    res.json({ success: true, data: breakdown });
  } catch (err) { next(err); }
};

exports.disbursementReport = async (req, res, next) => {
  try {
    const agg = await prisma.disbursement.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: true,
    });
    res.json({ success: true, data: agg });
  } catch (err) { next(err); }
};

exports.scholarshipReport = async (req, res, next) => {
  try {
    const scholarships = await prisma.scholarship.findMany({
      include: { _count: { select: { applications: true, disbursements: true } } },
    });
    res.json({ success: true, data: scholarships });
  } catch (err) { next(err); }
};

exports.getAuditLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, action, userId } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (userId) where.userId = userId;

    const logs = await prisma.auditLog.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { phone: true, email: true } } },
    });

    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
};

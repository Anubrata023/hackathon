// src/controllers/application.controller.js

const prisma   = require('../config/database').prisma;
const { AppError }         = require('../middleware/errorHandler');
const auditService         = require('../services/audit.service');
const notificationService  = require('../services/notification.service');
const emailService         = require('../services/email.service');
const eligibilityService   = require('../services/eligibility.service');

// ─── Helpers ──────────────────────────────────────────────
function generateApplicationNo(year) {
  const code = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `GMC-${year.replace('-', '')}-${code}`;
}

async function assertOwnerOrAdmin(application, userId, role) {
  if (application.userId !== userId && !['ADMIN', 'SUPER_ADMIN', 'VERIFIER'].includes(role)) {
    throw new AppError('Access denied', 403);
  }
}

// ─── Controllers ─────────────────────────────────────────

/**
 * GET /applications
 * Student: list own applications.
 */
exports.listMyApplications = async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where:   { userId: req.user.id },
      include: {
        scholarship: { select: { name: true, slug: true, amountPerYear: true, iconType: true } },
        disbursement: { select: { status: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: applications });
  } catch (err) { next(err); }
};

/**
 * POST /applications
 * Start a new scholarship application.
 */
exports.createApplication = async (req, res, next) => {
  try {
    const { scholarshipId } = req.body;
    const userId = req.user.id;

    // Ensure scholarship exists and is open
    const scholarship = await prisma.scholarship.findUnique({ where: { id: scholarshipId } });
    if (!scholarship) throw new AppError('Scholarship not found', 404);
    if (scholarship.status !== 'ACTIVE' && scholarship.status !== 'CLOSING_SOON') {
      throw new AppError('This scholarship is not accepting applications', 400);
    }
    if (new Date() > scholarship.applicationEndDate) {
      throw new AppError('Application deadline has passed', 400);
    }

    // Ensure student has a profile
    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError('Please complete your profile before applying', 400);

    // Check eligibility
    const eligibility = await eligibilityService.checkStudentEligibility(profile, scholarship);
    if (!eligibility.eligible) {
      throw new AppError(`Not eligible: ${eligibility.reason}`, 400);
    }

    // Prevent duplicate application
    const existing = await prisma.application.findFirst({
      where: { userId, scholarshipId, academicYear: scholarship.academicYear },
    });
    if (existing) throw new AppError('You have already applied for this scholarship this year', 409);

    // Check seats
    if (scholarship.seatsRemaining !== null && scholarship.seatsRemaining <= 0) {
      throw new AppError('No seats remaining for this scholarship', 400);
    }

    const applicationNo = generateApplicationNo(scholarship.academicYear);

    const application = await prisma.application.create({
      data: {
        applicationNo,
        userId,
        scholarshipId,
        status:      'DRAFT',
        academicYear: scholarship.academicYear,
        formData:    { profileSnapshot: profile },
      },
    });

    await auditService.log({
      action: 'APPLICATION_CREATED', userId, entityType: 'Application',
      entityId: application.id, req,
    });

    res.status(201).json({ success: true, data: application });
  } catch (err) { next(err); }
};

/**
 * GET /applications/:id
 */
exports.getApplication = async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where:   { id: req.params.id },
      include: {
        scholarship: true,
        documents:   { include: { document: true } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
        disbursement: true,
      },
    });
    if (!application) throw new AppError('Application not found', 404);
    await assertOwnerOrAdmin(application, req.user.id, req.user.role);
    res.json({ success: true, data: application });
  } catch (err) { next(err); }
};

/**
 * PUT /applications/:id
 * Update draft (add document references, remarks).
 */
exports.updateApplication = async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!application) throw new AppError('Application not found', 404);
    await assertOwnerOrAdmin(application, req.user.id, req.user.role);

    if (!['DRAFT'].includes(application.status)) {
      throw new AppError('Only draft applications can be edited', 400);
    }

    const { documentIds, studentRemarks, formData } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: application.id },
        data:  { studentRemarks, formData },
      });

      // Sync document attachments
      if (documentIds && Array.isArray(documentIds)) {
        await tx.applicationDocument.deleteMany({ where: { applicationId: app.id } });
        await tx.applicationDocument.createMany({
          data: documentIds.map(docId => ({ applicationId: app.id, documentId: docId })),
          skipDuplicates: true,
        });
      }

      return app;
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

/**
 * POST /applications/:id/submit
 * Submit a draft application for review.
 */
exports.submitApplication = async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where:   { id: req.params.id },
      include: {
        scholarship: true,
        documents: { include: { document: true } },
      },
    });
    if (!application) throw new AppError('Application not found', 404);
    if (application.userId !== req.user.id) throw new AppError('Access denied', 403);
    if (application.status !== 'DRAFT') throw new AppError('Only draft applications can be submitted', 400);

    // Validate required documents are attached
    const attachedTypes = application.documents.map(d => d.document.type);
    const missingDocs   = application.scholarship.requiredDocuments.filter(t => !attachedTypes.includes(t));
    if (missingDocs.length > 0) {
      throw new AppError(`Missing required documents: ${missingDocs.join(', ')}`, 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id: application.id },
        data:  { status: 'SUBMITTED', submittedAt: new Date() },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: app.id,
          fromStatus:    'DRAFT',
          toStatus:      'SUBMITTED',
          changedBy:     req.user.id,
          remarks:       'Submitted by student',
        },
      });

      return app;
    });

    // Notifications
    await notificationService.notify(req.user.id, {
      title: 'Application Submitted',
      body:  `Your application #${application.applicationNo} for ${application.scholarship.name} has been submitted successfully.`,
      type:  'application_update',
      meta:  { applicationId: application.id },
    });

    // Email confirmation
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.email) {
      await emailService.sendApplicationConfirmation(user.email, application);
    }

    await auditService.log({
      action: 'APPLICATION_SUBMITTED', userId: req.user.id,
      entityType: 'Application', entityId: application.id, req,
    });

    res.json({ success: true, message: 'Application submitted successfully', data: updated });
  } catch (err) { next(err); }
};

/**
 * POST /applications/:id/cancel
 */
exports.cancelApplication = async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!application) throw new AppError('Application not found', 404);
    if (application.userId !== req.user.id) throw new AppError('Access denied', 403);
    if (!['DRAFT', 'SUBMITTED'].includes(application.status)) {
      throw new AppError('Application cannot be cancelled at this stage', 400);
    }

    await prisma.$transaction([
      prisma.application.update({
        where: { id: application.id },
        data:  { status: 'CANCELLED' },
      }),
      prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: application.status,
          toStatus: 'CANCELLED',
          changedBy: req.user.id,
          remarks: req.body.reason || 'Cancelled by student',
        },
      }),
    ]);

    res.json({ success: true, message: 'Application cancelled' });
  } catch (err) { next(err); }
};

/**
 * GET /applications/:id/timeline
 */
exports.getApplicationTimeline = async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      select: { userId: true, applicationNo: true, statusHistory: { orderBy: { changedAt: 'asc' } } },
    });
    if (!application) throw new AppError('Not found', 404);
    await assertOwnerOrAdmin(application, req.user.id, req.user.role);
    res.json({ success: true, data: application.statusHistory });
  } catch (err) { next(err); }
};

/**
 * GET /applications/:id/download
 * Returns application data (PDF generation would happen client-side or via a PDF service).
 */
exports.downloadApplicationPDF = async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where:   { id: req.params.id },
      include: { scholarship: true, documents: { include: { document: true } } },
    });
    if (!application) throw new AppError('Not found', 404);
    await assertOwnerOrAdmin(application, req.user.id, req.user.role);

    // In production: generate PDF with puppeteer/pdf-lib and stream it
    res.json({
      success: true,
      message: 'PDF generation — pipe to pdf-lib/puppeteer in production',
      data: application,
    });
  } catch (err) { next(err); }
};

/**
 * POST /applications/:id/verify  (Verifier)
 */
exports.verifyApplication = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const application = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!application) throw new AppError('Not found', 404);
    if (application.status !== 'SUBMITTED') {
      throw new AppError('Only submitted applications can be verified', 400);
    }

    await prisma.$transaction([
      prisma.application.update({
        where: { id: application.id },
        data:  { status: 'INSTITUTION_VERIFIED', verifiedAt: new Date(), verifierRemarks: remarks },
      }),
      prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus:    'SUBMITTED',
          toStatus:      'INSTITUTION_VERIFIED',
          changedBy:     req.user.id,
          remarks,
        },
      }),
    ]);

    await notificationService.notify(application.userId, {
      title: 'Application Verified',
      body:  `Your application #${application.applicationNo} has been verified by your institution.`,
      type:  'application_update',
      meta:  { applicationId: application.id },
    });

    res.json({ success: true, message: 'Application verified' });
  } catch (err) { next(err); }
};

/**
 * GET /applications/admin/all  (Admin)
 */
exports.listAllApplications = async (req, res, next) => {
  try {
    const { status, scholarshipId, q, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status)       where.status       = status;
    if (scholarshipId) where.scholarshipId = scholarshipId;
    if (q) {
      where.OR = [
        { applicationNo: { contains: q, mode: 'insensitive' } },
        { user: { phone: { contains: q } } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where, skip,
        take: parseInt(limit),
        include: {
          user:        { select: { phone: true, email: true } },
          scholarship: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.application.count({ where }),
    ]);

    res.json({
      success: true,
      data: applications,
      meta: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) { next(err); }
};

/**
 * PATCH /applications/:id/status  (Admin)
 */
exports.changeApplicationStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const application = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!application) throw new AppError('Not found', 404);

    const updateData = { status, adminRemarks: remarks };
    if (status === 'APPROVED') updateData.approvedAt = new Date();
    if (status === 'REJECTED') updateData.rejectedAt = new Date();

    await prisma.$transaction([
      prisma.application.update({ where: { id: application.id }, data: updateData }),
      prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus:    application.status,
          toStatus:      status,
          changedBy:     req.user.id,
          remarks,
        },
      }),
    ]);

    await notificationService.notify(application.userId, {
      title: `Application ${status === 'APPROVED' ? 'Approved ✅' : 'Status Updated'}`,
      body:  `Your application #${application.applicationNo} status changed to: ${status}.`,
      type:  'application_update',
      meta:  { applicationId: application.id, status },
    });

    await auditService.log({
      action: `APPLICATION_${status}`, userId: req.user.id,
      entityType: 'Application', entityId: application.id, req, meta: { remarks },
    });

    res.json({ success: true, message: `Application ${status.toLowerCase()}` });
  } catch (err) { next(err); }
};

/**
 * POST /applications/admin/bulk-approve  (Admin)
 */
exports.bulkApprove = async (req, res, next) => {
  try {
    const { applicationIds, remarks } = req.body;

    const results = await Promise.allSettled(
      applicationIds.map(id =>
        prisma.$transaction([
          prisma.application.update({ where: { id }, data: { status: 'APPROVED', approvedAt: new Date() } }),
          prisma.applicationStatusHistory.create({
            data: {
              applicationId: id, fromStatus: 'PENDING_APPROVAL',
              toStatus: 'APPROVED', changedBy: req.user.id, remarks: remarks || 'Bulk approved',
            },
          }),
        ])
      )
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed    = results.filter(r => r.status === 'rejected').length;

    res.json({ success: true, message: `${succeeded} approved, ${failed} failed` });
  } catch (err) { next(err); }
};

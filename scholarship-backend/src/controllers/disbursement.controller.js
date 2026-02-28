// src/controllers/disbursement.controller.js
const prisma  = require('../config/database').prisma;
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notification.service');
const auditService        = require('../services/audit.service');

exports.listMyDisbursements = async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where:   { userId: req.user.id },
      select:  { id: true },
    });
    const applicationIds = applications.map(a => a.id);

    const disbursements = await prisma.disbursement.findMany({
      where:   { applicationId: { in: applicationIds } },
      include: {
        scholarship: { select: { name: true } },
        application: { select: { applicationNo: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: disbursements });
  } catch (err) { next(err); }
};

exports.getDisbursement = async (req, res, next) => {
  try {
    const disb = await prisma.disbursement.findUnique({
      where:   { applicationId: req.params.applicationId },
      include: {
        scholarship: { select: { name: true, amountPerYear: true } },
        application: { select: { applicationNo: true, userId: true } },
      },
    });
    if (!disb) throw new AppError('Disbursement not found', 404);

    if (disb.application.userId !== req.user.id && !['ADMIN','SUPER_ADMIN'].includes(req.user.role)) {
      throw new AppError('Access denied', 403);
    }

    res.json({ success: true, data: disb });
  } catch (err) { next(err); }
};

exports.initiateDisbursement = async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    const application = await prisma.application.findUnique({
      where:   { id: applicationId },
      include: { scholarship: true },
    });
    if (!application) throw new AppError('Application not found', 404);
    if (application.status !== 'APPROVED') throw new AppError('Only approved applications can be disbursed', 400);

    const existing = await prisma.disbursement.findUnique({ where: { applicationId } });
    if (existing) throw new AppError('Disbursement already initiated for this application', 409);

    // Get bank details from student profile
    const profile = await prisma.studentProfile.findUnique({ where: { userId: application.userId } });
    if (!profile?.bankAccountNo || !profile?.bankIFSC) {
      throw new AppError('Student has not linked a bank account', 400);
    }

    const disbursement = await prisma.$transaction(async (tx) => {
      const d = await tx.disbursement.create({
        data: {
          applicationId,
          scholarshipId: application.scholarshipId,
          amount:        application.scholarship.amountPerYear,
          status:        'INITIATED',
          bankAccount:   profile.bankAccountNo,
          ifscCode:      profile.bankIFSC,
          initiatedAt:   new Date(),
        },
      });

      await tx.application.update({
        where: { id: applicationId },
        data:  { status: 'DISBURSED' },
      });

      return d;
    });

    await notificationService.notify(application.userId, {
      title: '💰 Scholarship Disbursement Initiated',
      body:  `₹${application.scholarship.amountPerYear.toLocaleString('en-IN')} is being transferred to your bank account for ${application.scholarship.name}.`,
      type:  'disbursement',
      meta:  { disbursementId: disbursement.id },
    });

    await auditService.log({
      action: 'DISBURSEMENT_INITIATED', userId: req.user.id,
      entityType: 'Disbursement', entityId: disbursement.id, req,
      meta: { amount: disbursement.amount },
    });

    res.status(201).json({ success: true, data: disbursement });
  } catch (err) { next(err); }
};

exports.updateDisbursementStatus = async (req, res, next) => {
  try {
    const { status, transactionRef, failureReason } = req.body;

    const disb = await prisma.disbursement.update({
      where: { id: req.params.id },
      data: {
        status,
        transactionRef,
        failureReason,
        processedAt: ['PROCESSED', 'FAILED'].includes(status) ? new Date() : undefined,
      },
      include: { application: true },
    });

    await notificationService.notify(disb.application.userId, {
      title:  status === 'PROCESSED' ? '✅ Scholarship Amount Credited!' : '❌ Disbursement Failed',
      body:   status === 'PROCESSED'
        ? `₹${disb.amount.toLocaleString('en-IN')} credited to your bank account. Ref: ${transactionRef}`
        : `Disbursement failed: ${failureReason}. Contact support.`,
      type:  'disbursement',
      meta:  { disbursementId: disb.id },
    });

    res.json({ success: true, data: disb });
  } catch (err) { next(err); }
};

// src/controllers/document.controller.js

const path    = require('path');
const fs      = require('fs');
const prisma  = require('../config/database').prisma;
const { AppError } = require('../middleware/errorHandler');
const storageService = require('../services/storage.service');
const auditService   = require('../services/audit.service');

/**
 * POST /documents/upload
 * Upload a document file and create a Document record.
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);

    const { type } = req.body;
    if (!type) throw new AppError('Document type is required', 400);

    // Find or create profile
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) throw new AppError('Please complete your profile first', 400);

    const maxMB = parseInt(process.env.MAX_FILE_SIZE_MB || '5');
    if (req.file.size > maxMB * 1024 * 1024) {
      throw new AppError(`File size must be under ${maxMB}MB`, 400);
    }

    const ALLOWED_MIMES = ['image/jpeg','image/png','image/webp','application/pdf'];
    if (!ALLOWED_MIMES.includes(req.file.mimetype)) {
      throw new AppError('Only JPEG, PNG, WebP, or PDF files are allowed', 400);
    }

    // Upload to storage (S3 or local)
    const storageKey = await storageService.upload(req.file);

    const document = await prisma.document.create({
      data: {
        profileId:    profile.id,
        type,
        filename:     req.file.filename || path.basename(storageKey),
        originalName: req.file.originalname,
        mimeType:     req.file.mimetype,
        sizeBytes:    req.file.size,
        storageKey,
      },
    });

    await auditService.log({
      action: 'DOCUMENT_UPLOADED', userId: req.user.id,
      entityType: 'Document', entityId: document.id, req,
      meta: { type, filename: req.file.originalname },
    });

    res.status(201).json({ success: true, data: document });
  } catch (err) { next(err); }
};

/**
 * GET /documents
 */
exports.listMyDocuments = async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.json({ success: true, data: [] });

    const documents = await prisma.document.findMany({
      where:   { profileId: profile.id },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ success: true, data: documents });
  } catch (err) { next(err); }
};

/**
 * GET /documents/:id/meta
 */
exports.getDocumentMeta = async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) throw new AppError('Document not found', 404);

    const profile = await prisma.studentProfile.findUnique({ where: { id: doc.profileId } });
    if (profile.userId !== req.user.id && !['ADMIN','SUPER_ADMIN','VERIFIER'].includes(req.user.role)) {
      throw new AppError('Access denied', 403);
    }

    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

/**
 * GET /documents/:id
 * Download / stream the actual file.
 */
exports.downloadDocument = async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) throw new AppError('Document not found', 404);

    const profile = await prisma.studentProfile.findUnique({ where: { id: doc.profileId } });
    if (profile.userId !== req.user.id && !['ADMIN','SUPER_ADMIN','VERIFIER'].includes(req.user.role)) {
      throw new AppError('Access denied', 403);
    }

    const fileStream = await storageService.getStream(doc.storageKey);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
    fileStream.pipe(res);
  } catch (err) { next(err); }
};

/**
 * DELETE /documents/:id
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({
      where:   { id: req.params.id },
      include: { profile: true },
    });
    if (!doc) throw new AppError('Document not found', 404);
    if (doc.profile.userId !== req.user.id) throw new AppError('Access denied', 403);

    // Check if attached to a submitted/approved application
    const attached = await prisma.applicationDocument.findFirst({
      where: {
        documentId: doc.id,
        application: { status: { notIn: ['DRAFT', 'CANCELLED', 'REJECTED'] } },
      },
    });
    if (attached) throw new AppError('Cannot delete document attached to an active application', 400);

    await storageService.delete(doc.storageKey);
    await prisma.document.delete({ where: { id: doc.id } });

    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { next(err); }
};

/**
 * PATCH /documents/:id/verify  (Admin/Verifier)
 */
exports.verifyDocument = async (req, res, next) => {
  try {
    const doc = await prisma.document.update({
      where: { id: req.params.id },
      data:  { isVerified: true, verifiedBy: req.user.id },
    });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

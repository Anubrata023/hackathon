// src/routes/document.routes.js

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/document.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

router.use(authenticate);

// Upload a document (student uploads for their profile)
// Supports single file; field name = "file"; type in body
router.post('/upload',
  uploadMiddleware.single('file'),
  controller.uploadDocument
);

// List all documents for the current student
router.get('/', controller.listMyDocuments);

// Get metadata for a single document
router.get('/:id/meta', controller.getDocumentMeta);

// Download / view a document (scoped: student sees own; admin sees any)
router.get('/:id', controller.downloadDocument);

// Delete a document (only if not attached to a submitted application)
router.delete('/:id', controller.deleteDocument);

// Admin: mark a document as verified
router.patch('/:id/verify',
  authorize('ADMIN', 'VERIFIER', 'SUPER_ADMIN'),
  controller.verifyDocument
);

module.exports = router;

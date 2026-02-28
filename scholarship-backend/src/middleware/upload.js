// src/middleware/upload.js
// Multer configuration for document uploads

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { AppError } = require('./errorHandler');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOAD_DIR, req.user?.id || 'temp');
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('File type not allowed. Use JPEG, PNG, WebP, or PDF.', 400), false);
  }
};

const MAX_MB   = parseInt(process.env.MAX_FILE_SIZE_MB || '5');
const MAX_SIZE = MAX_MB * 1024 * 1024;

exports.uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

// src/services/storage.service.js
// Abstracted storage — local filesystem or AWS S3

const fs     = require('fs');
const path   = require('path');
const logger = require('../config/logger');

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const UPLOAD_DIR   = process.env.UPLOAD_DIR || './uploads';

// ── Local storage ─────────────────────────────────────────

const localUpload = async (file) => {
  // File already on disk from multer — just return relative path
  return path.relative(UPLOAD_DIR, file.path).replace(/\\/g, '/');
};

const localGetStream = async (storageKey) => {
  const fullPath = path.join(UPLOAD_DIR, storageKey);
  if (!fs.existsSync(fullPath)) throw new Error('File not found');
  return fs.createReadStream(fullPath);
};

const localDelete = async (storageKey) => {
  const fullPath = path.join(UPLOAD_DIR, storageKey);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

// ── S3 storage ────────────────────────────────────────────
// Uncomment and configure for production:
//
// const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
//
// const s3 = new S3Client({
//   region:      process.env.AWS_REGION,
//   credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
// });
// const BUCKET = process.env.AWS_S3_BUCKET;
//
// const s3Upload = async (file) => {
//   const key  = `documents/${Date.now()}-${file.originalname}`;
//   const body = fs.readFileSync(file.path);
//   await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: file.mimetype }));
//   fs.unlinkSync(file.path); // clean up local temp
//   return key;
// };
//
// const s3GetStream = async (key) => {
//   const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
//   const res = await s3.send(cmd);
//   return res.Body;
// };
//
// const s3Delete = async (key) => {
//   await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
// };

exports.upload = STORAGE_TYPE === 's3' ? (() => { throw new Error('Install @aws-sdk/client-s3 for S3 support'); }) : localUpload;
exports.getStream = STORAGE_TYPE === 's3' ? (() => { throw new Error('S3 not configured'); }) : localGetStream;
exports.delete    = STORAGE_TYPE === 's3' ? (() => { throw new Error('S3 not configured'); }) : localDelete;

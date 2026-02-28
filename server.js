// src/server.js
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

// ─── Import Routes ────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const servicesRoutes     = require('./routes/services');
const noticesRoutes      = require('./routes/notices');
const departmentsRoutes  = require('./routes/departments');
const grievancesRoutes   = require('./routes/grievances');
const contactRoutes      = require('./routes/contact');
const searchRoutes       = require('./routes/search');
const miscRoutes         = require('./routes/misc');
const uploadRoutes       = require('./routes/upload');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// ─── App Init ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Relax for serving frontend HTML
}));

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5500',
  credentials: true,
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many search requests.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/search', searchLimiter);

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/services',     servicesRoutes);
app.use('/api/notices',      noticesRoutes);
app.use('/api/departments',  departmentsRoutes);
app.use('/api/grievances',   grievancesRoutes);
app.use('/api/contact',      contactRoutes);
app.use('/api/search',       searchRoutes);
app.use('/api/upload',       uploadRoutes);
app.use('/api',              miscRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'Government of Assam Portal API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Serve Frontend HTML ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏛️  Government of Assam Portal API`);
  console.log(`   Running on: http://localhost:${PORT}`);
  console.log(`   Health:     http://localhost:${PORT}/health`);
  console.log(`   Env:        ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/services?category=municipal&lang=en`);
  console.log(`   GET    /api/notices?category=recruitment&lang=as`);
  console.log(`   GET    /api/departments?lang=hi`);
  console.log(`   POST   /api/grievances`);
  console.log(`   GET    /api/grievances/track/:ticketId`);
  console.log(`   POST   /api/contact`);
  console.log(`   GET    /api/search?q=scholarship&lang=bn`);
  console.log(`   GET    /api/stats`);
  console.log(`   GET    /api/quick-links`);
  console.log(`   GET    /api/admin/dashboard  (admin only)`);
});

module.exports = app;

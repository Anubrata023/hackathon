require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initializeDatabase } = require('./config/database');
const routes = require('./routes/index');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security & Middleware ─────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://swachh-assam.gov.in']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting ─────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, message: 'Too many complaints submitted. Please wait before submitting another.' },
  keyGenerator: (req) => req.ip + (req.body?.mobile || ''),
});

app.use('/api', generalLimiter);
app.use('/api/complaints', complaintLimiter);

// ── Static Files (uploaded images) ───────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: process.env.PORTAL_NAME || 'Swachh Assam Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────
app.use('/api', routes);

// ── API Docs (basic) ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: '♻️ Swachh Assam Waste Management API',
    version: '1.0.0',
    docs: `${process.env.BASE_URL || 'http://localhost:' + PORT}/api-docs`,
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me'],
      complaints: ['POST /api/complaints', 'GET /api/complaints/track/:refNum', 'GET /api/complaints', 'PATCH /api/complaints/:id/status'],
      schedule: ['GET /api/schedule', 'GET /api/schedule/today', 'POST /api/schedule'],
      bulk_pickup: ['POST /api/bulk-pickup', 'GET /api/bulk-pickup/track/:refNum'],
      services: ['POST /api/audit/request', 'POST /api/composting/register', 'GET /api/stats', 'GET /api/wards'],
      points: ['GET /api/points', 'POST /api/points/redeem'],
      notices: ['GET /api/notices', 'POST /api/notices'],
    }
  });
});

// ── 404 & Error Handlers ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────
async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log('\n♻️  ================================');
      console.log(`   Swachh Assam Backend Running`);
      console.log(`   URL: http://localhost:${PORT}`);
      console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
      console.log('   ================================\n');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;

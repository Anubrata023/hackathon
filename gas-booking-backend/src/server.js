// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ─────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Global rate limiter: 200 req / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});
app.use('/api', globalLimiter);

// ── ROUTES ─────────────────────────────────────────────────────────
app.use('/api/otp',          require('./routes/otp'));
app.use('/api/bookings',     require('./routes/bookings'));
app.use('/api/distributors', require('./routes/distributors'));
app.use('/api/consumers',    require('./routes/consumers'));
app.use('/api/admin',        require('./routes/admin'));

// ── HEALTH CHECK ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Gas Booking API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ── API DOCS (dev only) ────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    service: 'Gas Cylinder OTP Booking API',
    version: '1.0.0',
    endpoints: {
      otp: {
        'POST /api/otp/send':    'Send OTP to registered mobile',
        'POST /api/otp/verify':  'Verify OTP, receive session token',
        'POST /api/otp/resend':  'Resend OTP'
      },
      bookings: {
        'POST /api/bookings':              'Create new booking (auth required)',
        'GET /api/bookings/history':       'Get booking history (auth required)',
        'GET /api/bookings/:ref':          'Get booking by reference (auth required)',
        'DELETE /api/bookings/:ref/cancel':'Cancel a booking (auth required)'
      },
      distributors: {
        'GET /api/distributors':           'List available distributors (auth required)',
        'GET /api/distributors/:id/slots': 'Get delivery slots (auth required)'
      },
      consumers: {
        'GET /api/consumers/profile':      'Get consumer profile (auth required)',
        'PATCH /api/consumers/profile':    'Update profile (auth required)',
        'GET /api/consumers/subsidy':      'Subsidy history (auth required)'
      },
      admin: {
        'POST /api/admin/login':                  'Admin login',
        'GET /api/admin/dashboard':               'Dashboard stats (admin)',
        'GET /api/admin/bookings':                'All bookings (admin)',
        'PATCH /api/admin/bookings/:ref/status':  'Update booking status (admin)',
        'GET /api/admin/consumers':               'List consumers (admin)',
        'POST /api/admin/consumers':              'Create consumer (admin)',
        'POST /api/admin/slots':                  'Create delivery slots (admin)'
      }
    }
  });
});

// ── SPA FALLBACK ───────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ success: false, message: 'Route not found' });
  }
});

// ── ERROR HANDLER ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ── START ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Gas Booking API running on http://localhost:${PORT}`);
  console.log(`📚  API Docs:   http://localhost:${PORT}/api`);
  console.log(`❤️   Health:     http://localhost:${PORT}/api/health`);
  console.log(`🌍  Mode:       ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;

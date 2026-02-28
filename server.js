// src/server.js — Main entry point for GMC Water Supply Portal API
require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const path         = require('path');

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const connectionsRoutes = require('./routes/connections');
const billsRoutes       = require('./routes/bills');
const leakageRoutes     = require('./routes/leakage');
const tankerRoutes      = require('./routes/tanker');
const meterRoutes       = require('./routes/meterReadings');
const transfersRoutes   = require('./routes/transfers');
const supplyRoutes      = require('./routes/supplyStatus');
const miscRoutes        = require('./routes/misc');

const { notFound, errorHandler } = require('./middleware/errorHandler');

// ── App Init ──────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5500',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),  // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX || 100),
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
}));
app.use('/api/auth/login',    rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'Too many login attempts. Wait 15 minutes.' } }));
app.use('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 5,  message: { success: false, message: 'Too many registrations from this IP.' } }));
app.use('/api/search',        rateLimit({ windowMs: 60 * 1000, max: 30, message: { success: false, message: 'Too many search requests.' } }));

// ── Static Files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/bills',       billsRoutes);
app.use('/api/leakage',     leakageRoutes);
app.use('/api/tanker',      tankerRoutes);
app.use('/api/meter',       meterRoutes);
app.use('/api/transfers',   transfersRoutes);
app.use('/api/supply',      supplyRoutes);
app.use('/api',             miscRoutes);

// ── Serve Frontend ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
💧  GMC Water Supply Portal — Backend API
    Running on:  http://localhost:${PORT}
    Health:      http://localhost:${PORT}/api/health
    Environment: ${process.env.NODE_ENV || 'development'}

📡  API Endpoints:
    POST   /api/auth/register                  Register citizen
    POST   /api/auth/login                     Login
    GET    /api/auth/me                        My profile

    GET    /api/connections                    My connections
    POST   /api/connections                    Apply new connection
    GET    /api/connections/track/:appNum      Track application (public)

    GET    /api/bills                          My bills
    POST   /api/bills/:id/pay                  Pay a bill
    POST   /api/bills/:id/dispute              Dispute a bill

    POST   /api/leakage                        Report leakage (public)
    GET    /api/leakage/track/:ticketId        Track complaint (public)

    POST   /api/tanker                         Request tanker (public)
    GET    /api/tanker/track/:reqNum           Track tanker (public)

    POST   /api/meter/readings                 Submit meter reading
    POST   /api/meter/complaints               File meter complaint

    POST   /api/transfers                      Apply transfer / NOC

    GET    /api/supply/schedules               Ward schedules (public)
    GET    /api/supply/quality                 Water quality (public)
    GET    /api/supply/quality/latest          Latest reading (public)

    GET    /api/notices                        Notices (public)
    GET    /api/stats                          Hero counters (public)
    GET    /api/search?q=term                  Search (public)

    GET    /api/admin/dashboard                Admin summary (admin only)
  `);
});

module.exports = app;

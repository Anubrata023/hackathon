// src/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Routes
const consumersRouter   = require('./routes/consumers');
const consumptionRouter = require('./routes/consumption');
const billingRouter     = require('./routes/billing');
const alertsRouter      = require('./routes/alerts');
const tariffRouter      = require('./routes/tariff');
const complaintsRouter  = require('./routes/complaints');
const meterRouter       = require('./routes/meter');
const platformRouter    = require('./routes/platform');

// Middleware
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Initialize DB on startup (creates tables if needed)
require('./db/init').getDb();

const app = express();
const PORT = process.env.PORT || 3000;
const API = process.env.API_PREFIX || '/api/v1';

// ── Security & Logging ────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' ? '*' : process.env.CORS_ORIGIN?.split(','),
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate Limiting ─────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(API, limiter);

// ── Body Parsing ──────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Frontend ───────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API Routes ────────────────────────────────────
app.use(`${API}/platform`,    platformRouter);
app.use(`${API}/consumers`,   consumersRouter);
app.use(`${API}/consumption`, consumptionRouter);
app.use(`${API}/billing`,     billingRouter);
app.use(`${API}/alerts`,      alertsRouter);
app.use(`${API}/tariff`,      tariffRouter);
app.use(`${API}/complaints`,  complaintsRouter);
app.use(`${API}/meter`,       meterRouter);

// Root info
app.get('/', (req, res) => {
  res.json({
    service: 'APDCL Smart Meter Consumption API',
    version: '1.0.0',
    organisation: 'Assam Power Distribution Company Ltd. (APDCL), Government of Assam',
    docs: `http://localhost:${PORT}${API}/platform/health`,
    endpoints: {
      platform:    `${API}/platform/stats`,
      consumers:   `${API}/consumers/:consumerId`,
      consumption: `${API}/consumption/:consumerId/summary`,
      billing:     `${API}/billing/:consumerId/current`,
      alerts:      `${API}/alerts/:consumerId`,
      tariff:      `${API}/tariff`,
      complaints:  `${API}/complaints/:consumerId`,
      meter:       `${API}/meter/:consumerId/readings`,
    },
    demo_consumer_id: 'ASM-GHY-048271',
  });
});

// ── 404 & Error Handlers ──────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 APDCL Smart Meter API running`);
  console.log(`   URL  : http://localhost:${PORT}`);
  console.log(`   API  : http://localhost:${PORT}${API}`);
  console.log(`   Mode : ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n   Demo consumer: ASM-GHY-048271`);
  console.log(`   Try : GET http://localhost:${PORT}${API}/consumers/ASM-GHY-048271\n`);
});

module.exports = app;

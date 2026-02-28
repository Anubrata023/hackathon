// src/app.js
// Express application setup — middleware, routes, error handling

const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const compression   = require('compression');
const morgan        = require('morgan');
const rateLimit     = require('express-rate-limit');
const path          = require('path');

const logger        = require('./config/logger');
const apiRouter     = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// ─────────────────────────────────────────────
//  Security Headers
// ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─────────────────────────────────────────────
//  CORS
// ─────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
app.options('*', cors());

// ─────────────────────────────────────────────
//  Body Parsers
// ─────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─────────────────────────────────────────────
//  Compression
// ─────────────────────────────────────────────
app.use(compression());

// ─────────────────────────────────────────────
//  HTTP Logging
// ─────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health',
}));

// ─────────────────────────────────────────────
//  Global Rate Limiting
// ─────────────────────────────────────────────
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// ─────────────────────────────────────────────
//  Static Files (uploaded documents)
// ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─────────────────────────────────────────────
//  Health Check
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GMC Scholarship Portal API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
//  API Routes
// ─────────────────────────────────────────────
const prefix = process.env.API_PREFIX || '/api/v1';
app.use(prefix, apiRouter);

// ─────────────────────────────────────────────
//  Error Handlers (must be last)
// ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const initSchema        = require('./config/initSchema');
const authRoutes        = require('./routes/auth');
const userRoutes        = require('./routes/users');
const applicationRoutes = require('./routes/applications');
const { errorHandler }  = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Global Middleware ────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter (200 req / 15 min per IP)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'NagraSeva API', timestamp: new Date().toISOString() })
);

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users/profile', userRoutes);
app.use('/api/applications',  applicationRoutes);

// ── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found.' })
);

// ── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ────────────────────────────────────────────────
(async () => {
  try {
    await initSchema();
    app.listen(PORT, () => {
      console.log(`\n🚀  NagraSeva API running on http://localhost:${PORT}`);
      console.log(`📋  Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️   Database    : ${process.env.DB_NAME}@${process.env.DB_HOST}\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initializeDatabase } = require('./database/db');

const authRoutes         = require('./routes/auth');
const serviceRoutes      = require('./routes/services');
const connectionRoutes   = require('./routes/connections');
const billingRoutes      = require('./routes/billing');
const complaintRoutes    = require('./routes/complaints');
const adminRoutes        = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve your HTML frontend from the /public folder
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/services',      serviceRoutes);
app.use('/api/connections',   connectionRoutes);
app.use('/api/billing',       billingRoutes);
app.use('/api/complaints',    complaintRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Fallback: serve frontend for all non-API routes ────────────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ success: false, message: 'Route not found' });
  }
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ── Start Server ───────────────────────────────────────────────────────────────
initializeDatabase(() => {
  app.listen(PORT, () => {
    console.log(`\n✅  Gas Services Portal API running at http://localhost:${PORT}`);
    console.log(`📋  API Docs: http://localhost:${PORT}/api/health\n`);
  });
});

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize database (auto-detect simple or SQLite)
let dbType = 'simple';
try {
  require('./config/database');
  dbType = 'sqlite';
  console.log('📦 Using SQLite database');
} catch (error) {
  require('./config/database-simple');
  console.log('📦 Using Simple JSON database');
}

// Import routes
const authRoutes = require('./routes/auth');
const municipalRoutes = require('./routes/municipal');
const electricityRoutes = require('./routes/electricity');
const gasRoutes = require('./routes/gas');
const scholarshipRoutes = require('./routes/scholarship');

// Create Express app
const app = express();

// ═══════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════

// Security headers (relaxed for development)
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// ═══════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════

// Root route - redirect to welcome page (must be BEFORE static middleware)
app.get('/', (req, res) => {
  res.redirect('/welcome (1).html');
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Suvidha API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/municipal', municipalRoutes);
app.use('/api/electricity', electricityRoutes);
app.use('/api/gas', gasRoutes);
app.use('/api/scholarships', scholarshipRoutes);

// API info route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Suvidha - Government of Assam Digital Services API',
    version: '1.0.0',
    documentation: '/api/docs',
    modules: [
      {
        name: 'Municipal Services',
        endpoints: '/api/municipal/*',
        features: ['Waste Management', 'Grievances (Jan Sunwai)', 'Water Supply']
      },
      {
        name: 'Electricity Services',
        endpoints: '/api/electricity/*',
        features: ['New Connections', 'Bill Management', 'Meter Readings']
      },
      {
        name: 'Gas Services',
        endpoints: '/api/gas/*',
        features: ['LPG Booking', 'Pipeline Connections', 'Tracking']
      },
      {
        name: 'Scholarship Services',
        endpoints: '/api/scholarships/*',
        features: ['Applications', 'Eligibility Check', 'Tracking']
      }
    ]
  });
});

// ═══════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ═══════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ Suvidha API Server Running');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  🌐 Server: http://localhost:${PORT}`);
  console.log(`  🗄️  Database: SQLite (./data/suvidha.db)`);
  console.log(`  📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('  📡 API Endpoints:');
  console.log(`     • Auth:         /api/auth/*`);
  console.log(`     • Municipal:    /api/municipal/*`);
  console.log(`     • Electricity:  /api/electricity/*`);
  console.log(`     • Gas:          /api/gas/*`);
  console.log(`     • Scholarships: /api/scholarships/*`);
  console.log('');
  console.log('  🧪 Testing:');
  console.log(`     • Open: http://localhost:${PORT}/test.html`);
  console.log(`     • Health: http://localhost:${PORT}/health`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

module.exports = app;

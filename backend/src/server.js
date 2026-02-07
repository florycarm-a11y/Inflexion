/**
 * Inflexion Backend API Server
 * Express.js + PostgreSQL
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Routes
const articlesRoutes = require('./routes/articles');
const sourcesRoutes = require('./routes/sources');
const categoriesRoutes = require('./routes/categories');
const marketRoutes = require('./routes/market');
const searchRoutes = require('./routes/search');

// Services
const aggregator = require('./services/aggregator');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// ============================================
// API Routes
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API version
app.get('/api', (req, res) => {
    res.json({
        name: 'Inflexion API',
        version: '1.0.0',
        description: 'Geopolitics & Financial Markets News Aggregator',
        endpoints: {
            articles: '/api/articles',
            sources: '/api/sources',
            categories: '/api/categories',
            market: '/api/market',
            search: '/api/search'
        }
    });
});

// Mount routes
app.use('/api/articles', articlesRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/search', searchRoutes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);

    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================
// Server Startup
// ============================================

const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║   Inflexion API Server                        ║
║   ─────────────────────────────               ║
║   Port: ${PORT}                                 ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(14)}        ║
║                                               ║
╚═══════════════════════════════════════════════╝
    `);

    // Start news aggregation scheduler
    if (process.env.NODE_ENV !== 'test') {
        aggregator.startScheduler();
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

module.exports = app;

const express = require('express');
const path = require('path');
const cors = require('cors');
const { connectDatabase } = require('./config/database');
const { setupCleanupCron } = require('./scripts/cleanup-cron');

// Import routes
const appointmentsRouter = require('./routes/appointments');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// Serve admin static files
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// API Routes
app.use('/api', appointmentsRouter);
app.use('/api/admin', adminRouter);

// Test endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Lily Studio Appointment System'
    });
});

// Admin page route - MUST come before the catch-all route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Admin page route for any admin path
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Public page - catch-all route for SPA
app.get('*', (req, res) => {
    // Don't serve admin paths from public
    if (req.path.startsWith('/admin')) {
        res.status(404).send('Admin page not found');
        return;
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
async function startServer() {
    try {
        // Connect to database
        await connectDatabase();
        console.log('✅ Database connected successfully');
        
        // Setup cleanup cron job
        setupCleanupCron();
        console.log('✅ Cleanup cron job scheduled');
        
        // Start server
        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`✅ Admin panel: http://localhost:${PORT}/admin`);
            console.log(`✅ Public site: http://localhost:${PORT}`);
            console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
            console.log(`✅ API Test: http://localhost:${PORT}/api/test`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
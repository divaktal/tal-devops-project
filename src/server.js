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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public')));

// Serve admin static files
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// API Routes
app.use('/api', appointmentsRouter);
app.use('/api/admin', adminRouter);

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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
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

startServer();
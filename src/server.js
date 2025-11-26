const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { connectDatabase } = require('./config/database');
const appointmentRoutes = require('./routes/appointments');

const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/appointments', appointmentRoutes);

// ADD THIS — Prometheus /metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
    const db = req.app.locals.db;
    const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Lily Designer Studio API',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    };

    try {
        // Test database connection
        await db.query('SELECT 1 as test');
        healthCheck.database = 'connected';
        
        res.json(healthCheck);
    } catch (err) {
        console.error('Health check database error:', err);
        healthCheck.status = 'unhealthy';
        healthCheck.database = 'disconnected';
        healthCheck.error = err.message;
        
        res.status(503).json(healthCheck);
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialize database and start server
async function initializeApp() {
    try {
        const db = await connectDatabase();
        
        // Make db available to all routes
        app.locals.db = db;
        
        // Start server only after database is ready
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📁 Professional structure loaded`);
            console.log(`✅ Database connected and ready`);
        });
        
    } catch (error) {
        console.error('💥 Failed to initialize application:', error.message);
        process.exit(1);
    }
}

// Start the application
initializeApp();
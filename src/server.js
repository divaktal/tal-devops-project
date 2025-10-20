const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { connectDatabase } = require('./config/database');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/appointments', appointmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    const db = req.app.locals.db;
    
    // Test database connection
    db.query('SELECT 1 as test', (err) => {
        if (err) {
            console.error('Health check database error:', err);
            return res.status(500).json({ 
                status: 'unhealthy', 
                error: 'Database connection failed',
                timestamp: new Date().toISOString()
            });
        }
        
        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            service: 'Lily Designer Studio API',
            database: 'connected'
        });
    });
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
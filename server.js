const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Database setup
const db = new sqlite3.Database('./appointments.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firstName TEXT NOT NULL,
            familyName TEXT NOT NULL,
            phone TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// API Routes

// Create new appointment
app.post('/api/appointments', (req, res) => {
    const { firstName, familyName, phone, date, time } = req.body;
    
    if (!firstName || !familyName || !phone || !date || !time) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = `INSERT INTO appointments (firstName, familyName, phone, date, time) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [firstName, familyName, phone, date, time], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to save appointment' });
        }
        
        res.json({
            message: 'Appointment saved successfully',
            id: this.lastID
        });
    });
});

// Get all appointments (for admin)
app.get('/api/appointments', (req, res) => {
    const sql = `SELECT * FROM appointments ORDER BY date, time`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch appointments' });
        }
        
        res.json(rows);
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'Lily Designer Studio API'
    });
});

// Database test endpoint
app.get('/api/test-db', (req, res) => {
    db.all('SELECT * FROM appointments', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database test failed' });
        }
        res.json({
            status: 'success',
            totalAppointments: rows.length,
            appointments: rows
        });
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
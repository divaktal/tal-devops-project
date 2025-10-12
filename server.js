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

// Database connection with retry logic
function connectDatabase() {
    return new Promise((resolve, reject) => {
        const maxRetries = 5;
        const retryDelay = 2000;
        let attempts = 0;
        
        function attemptConnect() {
            attempts++;
            console.log(`🔌 Database connection attempt ${attempts}/${maxRetries}...`);
            
            const dbPath = process.env.DB_PATH || './data/appointments.db';
            
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error(`❌ Database connection failed (attempt ${attempts}):`, err.message);
                    
                    if (attempts < maxRetries) {
                        console.log(`⏳ Retrying in ${retryDelay}ms...`);
                        setTimeout(attemptConnect, retryDelay);
                    } else {
                        reject(new Error(`Failed to connect to database after ${maxRetries} attempts: ${err.message}`));
                    }
                } else {
                    console.log('✅ Database connected successfully!');
                    resolve(db);
                }
            });
        }
        
        attemptConnect();
    });
}

// Validation functions
const validation = {
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return '';
        return input.trim().replace(/[<>&"']/g, '');
    },

    isValidName: (name) => {
        if (!name || typeof name !== 'string') return false;
        const sanitized = name.trim();
        if (sanitized.length < 2 || sanitized.length > 50) return false;
        
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        return nameRegex.test(sanitized);
    },

    isValidPhone: (phone) => {
        if (!phone || typeof phone !== 'string') return false;
        const sanitized = phone.trim();
        if (sanitized.length < 10 || sanitized.length > 20) return false;
        
        const phoneRegex = /^[\+]?[0-9\s\-\(\)\.]{10,20}$/;
        return phoneRegex.test(sanitized);
    },

    isValidDate: (date) => {
        if (!date || typeof date !== 'string') return false;
        
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return !isNaN(selectedDate.getTime()) && selectedDate >= today;
    },

    isValidTime: (time) => {
        const allowedSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        return allowedSlots.includes(time);
    },

    validateAppointment: (appointment) => {
        const errors = [];

        if (!appointment.firstName) {
            errors.push('First name is required');
        } else if (!validation.isValidName(appointment.firstName)) {
            errors.push('First name must contain only letters, spaces, hyphens, or apostrophes (2-50 characters)');
        }

        if (!appointment.familyName) {
            errors.push('Family name is required');
        } else if (!validation.isValidName(appointment.familyName)) {
            errors.push('Family name must contain only letters, spaces, hyphens, or apostrophes (2-50 characters)');
        }

        if (!appointment.phone) {
            errors.push('Phone number is required');
        } else if (!validation.isValidPhone(appointment.phone)) {
            errors.push('Please enter a valid phone number (10-20 digits)');
        }

        if (!appointment.date) {
            errors.push('Date is required');
        } else if (!validation.isValidDate(appointment.date)) {
            errors.push('Please select a valid future date');
        }

        if (!appointment.time) {
            errors.push('Time is required');
        } else if (!validation.isValidTime(appointment.time)) {
            errors.push('Please select a valid time slot');
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            sanitizedData: {
                firstName: validation.sanitizeInput(appointment.firstName),
                familyName: validation.sanitizeInput(appointment.familyName),
                phone: validation.sanitizeInput(appointment.phone),
                date: appointment.date,
                time: appointment.time
            }
        };
    }
};

// API Routes

// Create new appointment with validation
app.post('/api/appointments', (req, res) => {
    const db = req.app.locals.db;
    const validationResult = validation.validateAppointment(req.body);
    
    if (!validationResult.isValid) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: validationResult.errors 
        });
    }

    const { firstName, familyName, phone, date, time } = validationResult.sanitizedData;

    // Check if time slot is already booked
    const checkSQL = `SELECT id FROM appointments WHERE date = ? AND time = ?`;
    
    db.get(checkSQL, [date, time], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (row) {
            return res.status(409).json({ 
                error: 'This time slot is already booked. Please choose a different time.' 
            });
        }
        
        // Book the appointment
        const insertSQL = `INSERT INTO appointments (firstName, familyName, phone, date, time) 
                         VALUES (?, ?, ?, ?, ?)`;
        
        db.run(insertSQL, [firstName, familyName, phone, date, time], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to save appointment' });
            }
            
            res.json({
                message: 'Appointment saved successfully!',
                id: this.lastID,
                appointment: {
                    firstName,
                    familyName,
                    phone,
                    date,
                    time
                }
            });
        });
    });
});

// Get all appointments
app.get('/api/appointments', (req, res) => {
    const db = req.app.locals.db;
    const sql = `SELECT * FROM appointments ORDER BY date, time`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch appointments' });
        }
        
        res.json(rows);
    });
});

// Get available time slots for a specific date
app.get('/api/available-slots/:date', (req, res) => {
    const db = req.app.locals.db;
    const date = req.params.date;
    
    if (!validation.isValidDate(date)) {
        return res.status(400).json({ error: 'Invalid date' });
    }
    
    const allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    
    const sql = `SELECT time FROM appointments WHERE date = ?`;
    
    db.all(sql, [date], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch booked slots' });
        }
        
        const bookedSlots = rows.map(row => row.time);
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        
        res.json({
            date: date,
            availableSlots: availableSlots,
            bookedSlots: bookedSlots,
            allSlots: allSlots
        });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const db = req.app.locals.db;
    
    // Test database connection
    db.get('SELECT 1 as test', (err) => {
        if (err) {
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
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize database and start server
async function initializeApp() {
    try {
        const db = await connectDatabase();
        
        // Create tables
        db.run(`CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firstName TEXT NOT NULL,
            familyName TEXT NOT NULL,
            phone TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(date, time)
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                console.log('✅ Appointments table ready');
            }
        });
        
        // Make db available to all routes
        app.locals.db = db;
        
        // Start server only after database is ready
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`🔄 Database retry logic enabled (5 attempts)`);
        });
        
    } catch (error) {
        console.error('💥 Failed to initialize application:', error.message);
        console.log('❌ Application cannot start without database connection');
        process.exit(1);
    }
}

// Start the application
initializeApp();
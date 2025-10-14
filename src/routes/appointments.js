const express = require('express');
const router = express.Router();
const validation = require('../middleware/validation');

// Create new appointment with validation
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const validationResult = validation.validateAppointment(req.body);
    
    if (!validationResult.isValid) {
        return res.status(400).json({ 
            success: false,
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
            return res.status(500).json({ 
                success: false,
                error: 'Database error',
                code: err.code
            });
        }
        
        if (row) {
            return res.status(409).json({ 
                success: false,
                error: 'This time slot is already booked. Please choose a different time.' 
            });
        }
        
        // Book the appointment
        const insertSQL = `INSERT INTO appointments (firstName, familyName, phone, date, time) 
                         VALUES (?, ?, ?, ?, ?)`;
        
        db.run(insertSQL, [firstName, familyName, phone, date, time], function(err) {
            if (err) {
                console.error('Database error:', err);
                
                // Provide more specific error information
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ 
                        success: false,
                        error: 'This time slot was just booked by another user. Please choose a different time.',
                        code: err.code
                    });
                }
                
                return res.status(500).json({ 
                    success: false,
                    error: 'Failed to save appointment',
                    code: err.code
                });
            }
            
            // SUCCESS RESPONSE
            res.json({
                success: true,
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
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const sql = `SELECT * FROM appointments ORDER BY date, time`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to fetch appointments' 
            });
        }
        
        res.json({
            success: true,
            appointments: rows
        });
    });
});

// Get available time slots for a specific date
router.get('/available-slots/:date', (req, res) => {
    const db = req.app.locals.db;
    const date = req.params.date;
    
    if (!validation.isValidDate(date)) {
        return res.status(400).json({ 
            success: false,
            error: 'Invalid date' 
        });
    }
    
    const allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    
    const sql = `SELECT time FROM appointments WHERE date = ?`;
    
    db.all(sql, [date], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to fetch booked slots' 
            });
        }
        
        const bookedSlots = rows.map(row => row.time);
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        
        res.json({
            success: true,
            date: date,
            availableSlots: availableSlots,
            bookedSlots: bookedSlots,
            allSlots: allSlots
        });
    });
});

module.exports = router;
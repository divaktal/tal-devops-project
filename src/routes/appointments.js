const express = require('express');
const router = express.Router();
const validation = require('../middleware/validation');

// Create new appointment with validation
router.post('/', async (req, res) => {
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

    try {
        // Check if time slot is already booked
        const checkSQL = `SELECT id FROM appointments WHERE date = $1 AND time = $2`;
        const checkResult = await db.query(checkSQL, [date, time]);
        
        console.log('🔍 Slot check:', { date, time, existing: checkResult.rows.length });
        
        if (checkResult.rows.length > 0) {
            return res.status(409).json({ 
                success: false,
                error: 'This time slot is already booked. Please choose a different time.' 
            });
        }
        
        // Book the appointment
        const insertSQL = `INSERT INTO appointments (firstName, familyName, phone, date, time) 
                         VALUES ($1, $2, $3, $4, $5) RETURNING id`;
        const insertResult = await db.query(insertSQL, [firstName, familyName, phone, date, time]);
        
        // SUCCESS RESPONSE
        res.json({
            success: true,
            message: 'Appointment saved successfully!',
            id: insertResult.rows[0].id,
            appointment: {
                firstName,
                familyName,
                phone,
                date,
                time
            }
        });
        
    } catch (err) {
        console.error('Database error:', err);
        
        // Provide more specific error information
        if (err.code === '23505') { // PostgreSQL unique violation
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
});

// Get all appointments
router.get('/', async (req, res) => {
    const db = req.app.locals.db;
    const sql = `SELECT * FROM appointments ORDER BY date, time`;
    
    try {
        const result = await db.query(sql);
        res.json({
            success: true,
            appointments: result.rows
        });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
            success: false,
            error: 'Failed to fetch appointments' 
        });
    }
});

// Get available time slots for a specific date
router.get('/available-slots/:date', async (req, res) => {
    const db = req.app.locals.db;
    const date = req.params.date;
    
    if (!validation.isValidDate(date)) {
        return res.status(400).json({ 
            success: false,
            error: 'Invalid date' 
        });
    }
    
    const allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    
    try {
        const sql = `SELECT time FROM appointments WHERE date = $1`;
        const result = await db.query(sql, [date]);
        
        const bookedSlots = result.rows.map(row => {
            // Convert PostgreSQL time to HH:MM format
            const time = row.time;
            if (typeof time === 'string') {
                return time.substring(0, 5); // Extract HH:MM from HH:MM:SS
            }
            return time;
        });
        
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        
        res.json({
            success: true,
            date: date,
            availableSlots: availableSlots,
            bookedSlots: bookedSlots,
            allSlots: allSlots
        });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
            success: false,
            error: 'Failed to fetch booked slots' 
        });
    }
});

// Delete appointment (for testing)
router.delete('/:id', async (req, res) => {
    const db = req.app.locals.db;
    const id = req.params.id;
    
    try {
        const sql = `DELETE FROM appointments WHERE id = $1`;
        await db.query(sql, [id]);
        
        res.json({
            success: true,
            message: 'Appointment deleted successfully!'
        });
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
            success: false,
            error: 'Failed to delete appointment' 
        });
    }
});

module.exports = router;
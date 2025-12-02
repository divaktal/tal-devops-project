const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { validateAppointment } = require('../middleware/validation');

// Book a new appointment
router.post('/book-appointment', validateAppointment, async (req, res) => {
    try {
        const { firstName, familyName, phone, date, time } = req.body;
        
        // Get current date and time
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMinute = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHour}:${currentMinute}`;
        
        // Check if date is in the past
        if (date < today) {
            return res.status(400).json({ 
                error: 'Cannot book appointments for past dates' 
            });
        }
        
        // Check if time is in the past (for today)
        if (date === today && time <= currentTime) {
            return res.status(400).json({ 
                error: 'Cannot book appointments for past times' 
            });
        }
        
        // Check if slot is blocked
        const blockedCheck = await pool.query(
            `SELECT * FROM blocked_slots 
             WHERE date = $1 AND (
                all_day = true OR
                (start_time <= $2 AND end_time >= $2) OR
                (start_time IS NULL AND end_time IS NOT NULL AND $2 <= end_time) OR
                (start_time IS NOT NULL AND end_time IS NULL AND $2 >= start_time)
             )`,
            [date, time]
        );
        
        if (blockedCheck.rows.length > 0) {
            return res.status(400).json({ 
                error: 'This time slot is not available' 
            });
        }
        
        // Check if slot is already booked
        const existingAppointment = await pool.query(
            'SELECT * FROM appointments WHERE date = $1 AND time = $2',
            [date, time]
        );
        
        if (existingAppointment.rows.length > 0) {
            return res.status(400).json({ 
                error: 'This time slot is already booked' 
            });
        }
        
        // Insert the appointment
        const result = await pool.query(
            `INSERT INTO appointments 
             (firstName, familyName, phone, date, time) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [firstName, familyName, phone, date, time]
        );
        
        res.json({ 
            success: true, 
            message: 'Appointment booked successfully',
            appointment: result.rows[0]
        });
        
    } catch (error) {
        console.error('Booking error:', error);
        
        // Handle unique constraint violation
        if (error.code === '23505') { // Unique violation
            res.status(400).json({ 
                error: 'This time slot is already booked' 
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to book appointment' 
            });
        }
    }
});

// Get available time slots for a specific date
router.get('/available-slots/:date', async (req, res) => {
    try {
        const date = req.params.date;
        const allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        
        // Get current date and time
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMinute = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHour}:${currentMinute}`;
        
        // Get booked appointments
        const bookedResult = await pool.query(
            'SELECT time FROM appointments WHERE date = $1',
            [date]
        );
        const bookedSlots = bookedResult.rows.map(row => {
            const time = row.time;
            return time.length > 5 ? time.substring(0, 5) : time;
        });
        
        // Get blocked slots
        const blockedResult = await pool.query(`
            SELECT * FROM blocked_slots 
            WHERE date = $1
        `, [date]);
        
        // Determine which slots are available
        const availableSlots = allSlots.filter(slot => {
            // Check if date is today and time is in the past
            if (date === today && slot <= currentTime) {
                return false;
            }
            
            // Check if booked
            if (bookedSlots.includes(slot)) return false;
            
            // Check if blocked
            const isBlocked = blockedResult.rows.some(block => {
                if (block.all_day) return true;
                
                if (block.start_time && block.end_time) {
                    const blockStart = block.start_time.substring(0, 5);
                    const blockEnd = block.end_time.substring(0, 5);
                    return slot >= blockStart && slot <= blockEnd;
                }
                
                if (block.start_time && !block.end_time) {
                    return slot >= block.start_time.substring(0, 5);
                }
                
                if (!block.start_time && block.end_time) {
                    return slot <= block.end_time.substring(0, 5);
                }
                
                return false;
            });
            
            return !isBlocked;
        });
        
        res.json({
            success: true,
            date: date,
            availableSlots: availableSlots,
            bookedSlots: bookedSlots,
            allSlots: allSlots,
            blockedSlots: blockedResult.rows,
            blockedInfo: blockedResult.rows.map(b => ({
                reason: b.reason,
                time: b.all_day ? 'All day' : `${b.start_time || ''} - ${b.end_time || ''}`
            })),
            isToday: date === today,
            currentTime: currentTime
        });
    } catch (error) {
        console.error('Available slots error:', error);
        res.status(500).json({ error: 'Failed to fetch available slots' });
    }
});

// Cleanup old appointments (to be called by cron job)
router.get('/cleanup-old-appointments', async (req, res) => {
    try {
        console.log('Starting appointment cleanup...');
        
        // Delete appointments older than yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const result = await pool.query(
            'DELETE FROM appointments WHERE date < $1 RETURNING *',
            [yesterdayStr]
        );
        
        console.log(`Cleaned up ${result.rows.length} old appointments`);
        
        res.json({
            success: true,
            message: `Cleaned up ${result.rows.length} old appointments`,
            deletedAppointments: result.rows
        });
        
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to cleanup old appointments' 
        });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// Configure multer for photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// ============ PUBLIC ROUTES (NO AUTH) ============

// Get public photos for website
router.get('/public/photos', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT id, filename, filepath, caption, category FROM photos WHERE is_active = true';
        const params = [];
        
        if (category) {
            query += ' AND category = $1';
            params.push(category);
        }
        
        query += ' ORDER BY display_order, uploaded_at DESC';
        
        const result = await pool.query(query, params);
        res.json({ success: true, photos: result.rows });
    } catch (error) {
        console.error('Public photos fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch photos' });
    }
});

// Get stats for dashboard
router.get('/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const [appointmentsToday, totalAppointments, totalPhotos, recentAppointments] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM appointments WHERE date = $1', [today]),
            pool.query('SELECT COUNT(*) FROM appointments'),
            pool.query('SELECT COUNT(*) FROM photos'),
            pool.query('SELECT * FROM appointments ORDER BY created_at DESC LIMIT 5')
        ]);
        
        res.json({
            success: true,
            stats: {
                appointmentsToday: parseInt(appointmentsToday.rows[0].count),
                totalAppointments: parseInt(totalAppointments.rows[0].count),
                totalPhotos: parseInt(totalPhotos.rows[0].count),
                recentAppointments: recentAppointments.rows
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get all photos (admin)
router.get('/photos', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM photos';
        const params = [];
        
        if (category) {
            query += ' WHERE category = $1';
            params.push(category);
        }
        
        query += ' ORDER BY display_order, uploaded_at DESC';
        
        const result = await pool.query(query, params);
        res.json({ success: true, photos: result.rows });
    } catch (error) {
        console.error('Photos fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch photos' });
    }
});

// Upload photo
router.post('/photos', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const { caption, category } = req.body;
        
        // Create correct filepath - use relative path from public folder
        const filepath = `/uploads/${req.file.filename}`;
        
        const result = await pool.query(
            `INSERT INTO photos (filename, original_name, filepath, caption, category, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
                req.file.filename,
                req.file.originalname,
                filepath, // Use the correct relative path
                caption || '',
                category || 'portfolio',
                true
            ]
        );
        
        res.json({
            success: true,
            photo: result.rows[0]
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Update photo
router.put('/photos/:id', async (req, res) => {
    try {
        const { caption, category, display_order, is_active } = req.body;
        
        const result = await pool.query(
            `UPDATE photos 
             SET caption = COALESCE($1, caption),
                 category = COALESCE($2, category),
                 display_order = COALESCE($3, display_order),
                 is_active = COALESCE($4, is_active)
             WHERE id = $5 RETURNING *`,
            [caption, category, display_order, is_active, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        
        res.json({ success: true, photo: result.rows[0] });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Update failed' });
    }
});

// Delete photo
router.delete('/photos/:id', async (req, res) => {
    try {
        // First get photo info to delete file
        const photoResult = await pool.query(
            'SELECT * FROM photos WHERE id = $1',
            [req.params.id]
        );
        
        if (photoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        
        const photo = photoResult.rows[0];
        const filePath = path.join(__dirname, '../../public', photo.filepath);
        
        // Delete from database
        await pool.query('DELETE FROM photos WHERE id = $1', [req.params.id]);
        
        // Delete file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        res.json({ success: true, message: 'Photo deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Get appointments
router.get('/appointments', async (req, res) => {
    try {
        const { date, limit = 50, offset = 0 } = req.query;
        let query = 'SELECT * FROM appointments';
        const params = [];
        
        if (date) {
            query += ' WHERE date = $1';
            params.push(date);
        }
        
        query += ' ORDER BY date DESC, time DESC';
        query += ' LIMIT $' + (params.length + 1);
        params.push(parseInt(limit));
        query += ' OFFSET $' + (params.length + 1);
        params.push(parseInt(offset));
        
        const result = await pool.query(query, params);
        const countResult = await pool.query('SELECT COUNT(*) FROM appointments');
        
        res.json({
            success: true,
            appointments: result.rows,
            total: parseInt(countResult.rows[0].count)
        });
    } catch (error) {
        console.error('Appointments fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Delete appointment
router.delete('/appointments/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Appointment deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Backup database
router.get('/backup', async (req, res) => {
    try {
        const appointments = await pool.query('SELECT * FROM appointments');
        const photos = await pool.query('SELECT * FROM photos');
        
        const backup = {
            timestamp: new Date().toISOString(),
            appointments: appointments.rows,
            photos: photos.rows
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="backup-${Date.now()}.json"`);
        res.send(JSON.stringify(backup, null, 2));
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: 'Backup failed' });
    }
});

// Export appointments to CSV
router.get('/export/appointments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM appointments ORDER BY date, time');
        
        // Convert to CSV
        let csv = 'ID,First Name,Family Name,Phone,Date,Time,Created At\n';
        
        result.rows.forEach(row => {
            csv += `"${row.id}","${row.firstname}","${row.familyname}","${row.phone}","${row.date}","${row.time}","${row.created_at}"\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=appointments.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Get blocked slots for a date range
router.get('/blocked-slots', async (req, res) => {
    try {
        const { start_date, end_date, date } = req.query;
        let query = 'SELECT * FROM blocked_slots';
        const params = [];
        
        if (date) {
            query += ' WHERE start_date = $1';
            params.push(date);
        } else if (start_date && end_date) {
            query += ' WHERE start_date >= $1 AND start_date <= $2';
            params.push(start_date, end_date);
        }
        
        query += ' ORDER BY start_date, start_time';
        
        const result = await pool.query(query, params);
        res.json({ success: true, blockedSlots: result.rows });
    } catch (error) {
        console.error('Blocked slots fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch blocked slots' });
    }
});

router.get('/blocked-slots/check', async (req, res) => {
    try {
        const { date, time } = req.query;
        
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }
        
        // Check for all-day blocks
        const allDayQuery = `
            SELECT * FROM blocked_slots 
            WHERE start_date = $1
            AND all_day = true
        `;
        const allDayResult = await pool.query(allDayQuery, [date]);
        
        if (allDayResult.rows.length > 0) {
            return res.json({ 
                success: true, 
                isBlocked: true, 
                reason: allDayResult.rows[0].reason
            });
        }
        
        // If checking specific time
        if (time) {
            const timeQuery = `
                SELECT * FROM blocked_slots 
                WHERE start_date = $1
                AND (
                    (start_time IS NULL AND end_time IS NULL) OR
                    ($2::time BETWEEN start_time AND end_time) OR
                    (start_time IS NOT NULL AND end_time IS NULL AND $2::time >= start_time) OR
                    (start_time IS NULL AND end_time IS NOT NULL AND $2::time <= end_time)
                )
            `;
            const timeResult = await pool.query(timeQuery, [date, time]);
            
            if (timeResult.rows.length > 0) {
                return res.json({ 
                    success: true, 
                    isBlocked: true, 
                    reason: timeResult.rows[0].reason
                });
            }
        }
        
        res.json({ success: true, isBlocked: false });
    } catch (error) {
        console.error('Block check error:', error);
        res.status(500).json({ error: 'Failed to check block status' });
    }
});

// Add blocked slot - ALL DAYS STORED AS INDIVIDUAL ENTRIES
router.post('/blocked-slots', async (req, res) => {
    try {
        const { 
            date, 
            start_time, 
            end_time, 
            all_day, 
            reason,
            end_date,  // For date ranges
            recurring_pattern // For weekly recurring
        } = req.body;
        
        console.log('Block request:', req.body);
        
        // Validate
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }
        
        let slotsToCreate = [];
        
        // ========== DATE RANGE LOGIC ==========
        if (end_date) {
            const startDate = new Date(date);
            const rangeEndDate = new Date(end_date);
            
            // Validate
            if (rangeEndDate < startDate) {
                return res.status(400).json({ error: 'End date must be after start date' });
            }
            
            // Create separate entries for each day in the range
            const currentDate = new Date(startDate);
            
            while (currentDate <= rangeEndDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                
                // Check if this specific day is already blocked
                const existingCheck = await pool.query(`
                    SELECT id FROM blocked_slots 
                    WHERE start_date = $1
                    AND (
                        $2 = true OR  -- If trying to add all-day block
                        ($3::time BETWEEN start_time AND end_time) OR
                        (start_time IS NULL AND end_time IS NOT NULL AND $3::time <= end_time) OR
                        (start_time IS NOT NULL AND end_time IS NULL AND $3::time >= start_time)
                    )
                `, [dateStr, all_day, start_time || '09:00']);
                
                if (existingCheck.rows.length === 0) {
                    slotsToCreate.push({ 
                        start_date: dateStr,
                        end_date: null,  // Individual day, no end_date
                        start_time: all_day ? null : (start_time || '09:00'),
                        end_time: all_day ? null : (end_time || '17:00'),
                        all_day: all_day || false,
                        reason: reason || 'Blocked'
                    });
                }
                
                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        // ========== WEEKLY RECURRING LOGIC ==========
        else if (recurring_pattern && recurring_pattern.type === 'weekly') {
            const { days, weeks } = recurring_pattern;
            if (days && Array.isArray(days)) {
                const baseDate = new Date(date);
                
                for (let week = 0; week < (weeks || 4); week++) {
                    days.forEach(dayIndex => {
                        const slotDate = new Date(baseDate);
                        
                        // Calculate days to add
                        const currentDayOfWeek = baseDate.getDay();
                        let daysToAdd = (dayIndex - currentDayOfWeek + 7) % 7;
                        
                        // Skip if it's today (unless week > 0)
                        if (week === 0 && daysToAdd === 0) {
                            daysToAdd = 7; // Skip to next week
                        } else {
                            daysToAdd += (week * 7);
                        }
                        
                        slotDate.setDate(slotDate.getDate() + daysToAdd);
                        const slotDateStr = slotDate.toISOString().split('T')[0];
                        
                        // Check if this specific day is already blocked
                        const existingCheck = pool.query(`
                            SELECT id FROM blocked_slots 
                            WHERE start_date = $1
                            AND (
                                $2 = true OR
                                ($3::time BETWEEN start_time AND end_time) OR
                                (start_time IS NULL AND end_time IS NOT NULL AND $3::time <= end_time) OR
                                (start_time IS NOT NULL AND end_time IS NULL AND $3::time >= start_time)
                            )
                        `, [slotDateStr, all_day, start_time || '09:00']).then(result => result.rows.length === 0);
                        
                        // We'll check duplicates in the insert loop
                        slotsToCreate.push({
                            start_date: slotDateStr,
                            end_date: null,
                            start_time: all_day ? null : (start_time || '09:00'),
                            end_time: all_day ? null : (end_time || '17:00'),
                            all_day: all_day || false,
                            reason: reason || 'Blocked'
                        });
                    });
                }
            }
        }
        // ========== SINGLE DAY LOGIC ==========
        else {
            // Check for existing blocks on this date
            const existingCheck = await pool.query(`
                SELECT id FROM blocked_slots 
                WHERE start_date = $1
                AND (
                    $2 = true OR  -- If trying to add all-day block
                    ($3::time BETWEEN start_time AND end_time) OR
                    (start_time IS NULL AND end_time IS NOT NULL AND $3::time <= end_time) OR
                    (start_time IS NOT NULL AND end_time IS NULL AND $3::time >= start_time)
                )
            `, [date, all_day, start_time || '09:00']);
            
            if (existingCheck.rows.length === 0) {
                slotsToCreate.push({ 
                    start_date: date,
                    end_date: null,
                    start_time: all_day ? null : (start_time || '09:00'),
                    end_time: all_day ? null : (end_time || '17:00'),
                    all_day: all_day || false,
                    reason: reason || 'Blocked'
                });
            }
        }
        
        console.log(`Creating ${slotsToCreate.length} slot(s)`);
        
        if (slotsToCreate.length === 0) {
            return res.status(400).json({ 
                error: 'All selected time slots are already blocked' 
            });
        }
        
        // Insert all slots
        const insertedSlots = [];
        for (const slot of slotsToCreate) {
            try {
                const result = await pool.query(
                    `INSERT INTO blocked_slots 
                    (start_date, end_date, start_time, end_time, all_day, reason)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *`,
                    [
                        slot.start_date,
                        slot.end_date,
                        slot.start_time,
                        slot.end_time,
                        slot.all_day,
                        slot.reason || ''
                    ]
                );
                insertedSlots.push(result.rows[0]);
                console.log(`Created block: ${slot.start_date}`);
            } catch (insertError) {
                if (insertError.code === '23505') { // Unique violation
                    console.log(`Skipping duplicate: ${slot.start_date}`);
                    continue;
                }
                throw insertError;
            }
        }
        
        res.json({ 
            success: true, 
            message: `Created ${insertedSlots.length} blocked slot(s)`,
            blockedSlots: insertedSlots
        });
        
    } catch (error) {
        console.error('Add blocked slot error:', error);
        console.error('Error details:', error.message, error.code);
        
        if (error.code === '23505') {
            res.status(400).json({ 
                error: 'This time slot is already blocked' 
            });
        } else if (error.code === '23502') {
            res.status(400).json({ 
                error: 'Missing required fields' 
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to add blocked slot',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
});

// Delete blocked slot
router.delete('/blocked-slots/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM blocked_slots WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Blocked slot not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Blocked slot deleted',
            blockedSlot: result.rows[0]
        });
    } catch (error) {
        console.error('Delete blocked slot error:', error);
        res.status(500).json({ error: 'Failed to delete blocked slot' });
    }
});

// Get available time slots (considering blocks)
router.get('/available-slots/:date', async (req, res) => {
    try {
        const date = req.params.date;
        const allSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        
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
            WHERE start_date = $1
        `, [date]);
        
        // Determine which slots are available
        const availableSlots = allSlots.filter(slot => {
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
            }))
        });
    } catch (error) {
        console.error('Available slots error:', error);
        res.status(500).json({ error: 'Failed to fetch available slots' });
    }
});

// Get appointments timeline for a specific date
router.get('/appointments/timeline', async (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }
        
        // Get appointments for the specific date
        const appointmentsResult = await pool.query(
            `SELECT * FROM appointments 
             WHERE date = $1 
             ORDER BY time`,
            [date]
        );
        
        // Get blocked slots for the same date
        const blockedSlotsResult = await pool.query(
            `SELECT * FROM blocked_slots 
            WHERE start_date = $1
            ORDER BY start_time`,
            [date]
        );
        
        // Generate time slots for the day (9am to 5pm)
        const timeSlots = [];
        for (let hour = 9; hour <= 17; hour++) {
            timeSlots.push({
                time: `${hour.toString().padStart(2, '0')}:00`,
                hour: hour,
                display: `${hour}:00`
            });
        }
        
        // Format the data for timeline view
        const timelineData = timeSlots.map(slot => {
            const appointment = appointmentsResult.rows.find(apt => {
                const aptTime = apt.time.substring(0, 5); // Get HH:MM
                return aptTime === slot.time;
            });
            
            const blockedSlot = blockedSlotsResult.rows.find(block => {
                if (block.all_day) return true;
                
                if (block.start_time && block.end_time) {
                    const blockStart = block.start_time.substring(0, 5);
                    const blockEnd = block.end_time.substring(0, 5);
                    return slot.time >= blockStart && slot.time <= blockEnd;
                }
                
                return false;
            });
            
            return {
                time: slot.time,
                display: slot.display,
                appointment: appointment ? {
                    id: appointment.id,
                    firstName: appointment.firstname,
                    familyName: appointment.familyname,
                    phone: appointment.phone,
                    time: appointment.time.substring(0, 5)
                } : null,
                blocked: blockedSlot ? {
                    reason: blockedSlot.reason,
                    allDay: blockedSlot.all_day,
                    startTime: blockedSlot.start_time,
                    endTime: blockedSlot.end_time
                } : null,
                isAvailable: !appointment && !blockedSlot
            };
        });
        
        res.json({
            success: true,
            date: date,
            timeline: timelineData,
            summary: {
                totalAppointments: appointmentsResult.rows.length,
                totalBlocked: blockedSlotsResult.rows.length,
                availableSlots: timelineData.filter(slot => slot.isAvailable).length
            }
        });
    } catch (error) {
        console.error('Timeline fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch timeline data' });
    }
});

// Get appointments calendar view (monthly)
router.get('/appointments/calendar', async (req, res) => {
    try {
        const { year, month } = req.query;
        
        // Default to current month if not specified
        const currentDate = new Date();
        const targetYear = parseInt(year) || currentDate.getFullYear();
        const targetMonth = parseInt(month) || currentDate.getMonth() + 1;
        
        // Calculate date range
        const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
        const endDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-31`;
        
        // Get appointments for the month
        const appointmentsResult = await pool.query(
            `SELECT date, COUNT(*) as count, 
                    ARRAY_AGG(time ORDER BY time) as times
             FROM appointments 
             WHERE date >= $1 AND date <= $2
             GROUP BY date
             ORDER BY date`,
            [startDate, endDate]
        );
        
        // Get blocked days for the month
        const blockedDaysResult = await pool.query(
            `SELECT DISTINCT start_date as date
            FROM blocked_slots 
            WHERE start_date >= $1 AND start_date <= $2
            ORDER BY start_date`,
            [startDate, endDate]
        );
        
        // Create calendar data
        const calendarData = [];
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dateObj = new Date(dateStr);
            const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
            
            const appointmentsForDay = appointmentsResult.rows.find(a => a.date === dateStr);
            const blockedForDay = blockedDaysResult.rows.find(b => b.date === dateStr);
            
            calendarData.push({
                date: dateStr,
                day: day,
                dayOfWeek: dayOfWeek,
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
                appointmentCount: appointmentsForDay ? parseInt(appointmentsForDay.count) : 0,
                appointmentTimes: appointmentsForDay ? appointmentsForDay.times : [],
                isBlocked: !!blockedForDay,
                blockedCount: blockedForDay ? 1 : 0 
            });
        }
        
        res.json({
            success: true,
            year: targetYear,
            month: targetMonth,
            monthName: new Date(targetYear, targetMonth - 1, 1).toLocaleString('default', { month: 'long' }),
            calendar: calendarData
        });
    } catch (error) {
        console.error('Calendar fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch calendar data' });
    }
});

module.exports = router;
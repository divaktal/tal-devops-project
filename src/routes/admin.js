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
        
        const result = await pool.query(
            `INSERT INTO photos (filename, original_name, filepath, caption, category, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [
                req.file.filename,
                req.file.originalname,
                `/uploads/${req.file.filename}`,
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
            query += ' WHERE date = $1';
            params.push(date);
        } else if (start_date && end_date) {
            query += ' WHERE date BETWEEN $1 AND $2';
            params.push(start_date, end_date);
        }
        
        query += ' ORDER BY date, start_time';
        
        const result = await pool.query(query, params);
        res.json({ success: true, blockedSlots: result.rows });
    } catch (error) {
        console.error('Blocked slots fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch blocked slots' });
    }
});

// Check if a specific time slot is blocked
router.get('/blocked-slots/check', async (req, res) => {
    try {
        const { date, time } = req.query;
        
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }
        
        // Check for all-day blocks
        const allDayQuery = `
            SELECT * FROM blocked_slots 
            WHERE date = $1 AND all_day = true
        `;
        const allDayResult = await pool.query(allDayQuery, [date]);
        
        if (allDayResult.rows.length > 0) {
            return res.json({ 
                success: true, 
                isBlocked: true, 
                reason: allDayResult.rows[0].reason,
                blockType: 'all_day'
            });
        }
        
        // If checking specific time
        if (time) {
            const timeQuery = `
                SELECT * FROM blocked_slots 
                WHERE date = $1 AND (
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
                    reason: timeResult.rows[0].reason,
                    blockType: timeResult.rows[0].block_type
                });
            }
        }
        
        res.json({ success: true, isBlocked: false });
    } catch (error) {
        console.error('Block check error:', error);
        res.status(500).json({ error: 'Failed to check block status' });
    }
});

// Add blocked slot
router.post('/blocked-slots', async (req, res) => {
    try {
        const { 
            date, 
            start_time, 
            end_time, 
            all_day, 
            reason, 
            block_type,
            recurring_pattern
        } = req.body;
        
        // Validate
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }
        
        // For recurring blocks, create multiple entries
        let slotsToCreate = [{ date, start_time, end_time, all_day, reason, block_type }];
        
       if (recurring_pattern && block_type === 'weekly') {
    const { days, weeks } = recurring_pattern;
    if (days && Array.isArray(days)) {
        // Create slots for each day for the next X weeks
        const baseDate = new Date(date);
        slotsToCreate = [];
        
        for (let week = 0; week < (weeks || 4); week++) {
            days.forEach(dayIndex => {
                const slotDate = new Date(baseDate);
                // Calculate the target date
                // dayIndex: 0=Sunday, 1=Monday, ..., 6=Saturday
                const currentDayOfWeek = baseDate.getDay(); // 0-6
                let daysToAdd = (dayIndex - currentDayOfWeek + 7) % 7;
                daysToAdd += (week * 7);
                
                slotDate.setDate(slotDate.getDate() + daysToAdd);
                
                // Only create if it's a future date (not the original)
                if (slotDate.toISOString().split('T')[0] !== date) {
                    slotsToCreate.push({
                        date: slotDate.toISOString().split('T')[0],
                        start_time,
                        end_time,
                        all_day,
                        reason: `${reason} (Recurring Week ${week + 1})`,
                        block_type,
                        recurring_pattern: JSON.stringify(recurring_pattern)
                    });
                }
            });
        }
    }
}
        
        // Insert all slots
        const insertedSlots = [];
        for (const slot of slotsToCreate) {
            const result = await pool.query(
                `INSERT INTO blocked_slots 
                (date, start_time, end_time, all_day, reason, block_type, recurring_pattern)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [
                    slot.date,
                    slot.start_time || null,
                    slot.end_time || null,
                    slot.all_day || false,
                    slot.reason || '',
                    slot.block_type || 'single',
                    slot.recurring_pattern || null
                ]
                );
            insertedSlots.push(result.rows[0]);
        }
        
        res.json({ 
            success: true, 
            message: `Created ${insertedSlots.length} blocked slot(s)`,
            blockedSlots: insertedSlots
        });
    } catch (error) {
        console.error('Add blocked slot error:', error);
        res.status(500).json({ error: 'Failed to add blocked slot' });
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
            WHERE date = $1
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

module.exports = router;
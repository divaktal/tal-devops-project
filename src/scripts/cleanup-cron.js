const cron = require('node-cron');
const { pool } = require('../config/database');

// Function to cleanup old appointments
async function cleanupOldAppointments() {
    try {
        console.log('🔄 Running weekly appointment cleanup...');
        
        // Delete appointments older than 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
        
        const result = await pool.query(
            'DELETE FROM appointments WHERE date < $1 RETURNING *',
            [oneWeekAgoStr]
        );
        
        if (result.rows.length > 0) {
            console.log(`✅ Cleaned up ${result.rows.length} old appointments (older than ${oneWeekAgoStr})`);
            
            // Log deleted appointments for audit
            result.rows.forEach(appt => {
                console.log(`   - Deleted: ${appt.date} ${appt.time} - ${appt.firstname} ${appt.familyname}`);
            });
        } else {
            console.log('✅ No old appointments to cleanup');
        }
        
        return {
            success: true,
            deletedCount: result.rows.length,
            deletedAppointments: result.rows
        };
        
    } catch (error) {
        console.error('❌ Cleanup error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Setup cron job to run every Monday at 2:00 AM
function setupCleanupCron() {
    // Schedule cleanup every Monday at 2:00 AM
    // '0 2 * * 1' = minute 0, hour 2, any day of month, any month, Monday (1)
    const job = cron.schedule('0 2 * * 1', async () => {
        console.log('⏰ Running scheduled appointment cleanup...');
        await cleanupOldAppointments();
    }, {
        scheduled: true,
        timezone: "Asia/Jerusalem" // Adjust to your timezone
    });
    
    console.log('✅ Cleanup cron job scheduled: Every Monday at 2:00 AM');
    
    // For testing: Run immediately on startup (comment out in production)
    // console.log('🔧 Running initial cleanup for testing...');
    // cleanupOldAppointments();
    
    return job;
}

// Manual cleanup endpoint (for testing or manual trigger)
async function manualCleanup() {
    console.log('🔧 Running manual appointment cleanup...');
    return await cleanupOldAppointments();
}

module.exports = {
    setupCleanupCron,
    cleanupOldAppointments,
    manualCleanup
};
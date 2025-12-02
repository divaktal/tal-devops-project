require('dotenv').config();
const { pool } = require('../config/database');

async function setupAdmin() {
    console.log('🔧 Setting up admin system...');
    
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');
        
        // Create photos table
        console.log('Creating photos table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS photos (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255),
                filepath VARCHAR(500) NOT NULL,
                caption TEXT,
                category VARCHAR(100) DEFAULT 'portfolio',
                display_order INT DEFAULT 0,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        `);
        
        // Create blocked_slots table
        console.log('Creating blocked_slots table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS blocked_slots (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                start_time TIME,
                end_time TIME,
                all_day BOOLEAN DEFAULT false,
                reason VARCHAR(255),
                block_type VARCHAR(50) DEFAULT 'single',
                -- single, daily_range, time_range, weekly, custom
                recurring_pattern JSONB,
                -- For recurring blocks: {"type": "weekly", "days": [0,6]} etc.
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create index for faster queries
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_blocked_slots_date 
            ON blocked_slots(date, start_time, end_time)
        `);
        
        console.log('✅ Admin setup completed!');
        console.log('🌐 Admin panel URL: http://localhost:3000/admin');
        console.log('📸 Features:');
        console.log('   - Photo management (upload, edit, delete)');
        console.log('   - Appointment viewing and deletion');
        console.log('   - Blocked slots management');
        console.log('   - Dashboard with statistics');
        console.log('   - Database backup and export');
        console.log('\n⚠️  Note: This admin panel has NO LOGIN. Anyone with the URL can access it.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setupAdmin();
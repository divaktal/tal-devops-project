const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'lily_studio',
  user: process.env.DB_USER || 'lily_user',
  password: process.env.DB_PASSWORD || 'lily123',
  connectionTimeoutMillis: 10000,
  max: 20,
  idleTimeoutMillis: 30000,
});

// Add connection error handling
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

// Helper function to check for duplicate blocked slots
async function checkExistingBlockedSlot(blockData) {
  const client = await pool.connect();
  try {
    const { start_date, end_date, start_time, end_time, all_day, block_type, recurring_pattern } = blockData;
    
    // For recurring blocks, check for overlapping patterns
    if (block_type === 'recurring' && recurring_pattern) {
      const pattern = JSON.stringify(recurring_pattern);
      
      // Check for recurring blocks with same pattern
      const recurringCheck = await client.query(
        `SELECT id FROM blocked_slots 
         WHERE block_type = 'recurring' 
         AND recurring_pattern::text = $1::text
         AND (start_date = $2 OR $2 BETWEEN start_date AND COALESCE(end_date, start_date))`,
        [pattern, start_date]
      );
      
      return recurringCheck.rows.length > 0;
    }
    
    // For single or range blocks, check for exact duplicates
    const duplicateCheck = await client.query(
      `SELECT id FROM blocked_slots 
       WHERE start_date = $1 
       AND COALESCE(end_date, $1) = COALESCE($2, $1)
       AND (start_time IS NOT DISTINCT FROM $3)
       AND (end_time IS NOT DISTINCT FROM $4)
       AND all_day = $5 
       AND block_type = $6
       AND (recurring_pattern IS NOT DISTINCT FROM $7::jsonb)`,
      [
        start_date, 
        end_date || start_date, 
        start_time, 
        end_time, 
        all_day, 
        block_type, 
        JSON.stringify(recurring_pattern)
      ]
    );
    
    return duplicateCheck.rows.length > 0;
  } finally {
    client.release();
  }
}

// Function to add blocked slot with duplicate check
async function addBlockedSlot(blockData) {
  const client = await pool.connect();
  try {
    // Check for duplicates
    const isDuplicate = await checkExistingBlockedSlot(blockData);
    if (isDuplicate) {
      throw new Error('This time slot is already blocked');
    }
    
    const { start_date, end_date, start_time, end_time, all_day, reason, block_type, recurring_pattern } = blockData;
    
    const result = await client.query(
      `INSERT INTO blocked_slots 
       (start_date, end_date, start_time, end_time, all_day, reason, block_type, recurring_pattern) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb) 
       RETURNING *`,
      [start_date, end_date, start_time, end_time, all_day, reason, block_type, JSON.stringify(recurring_pattern)]
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Function to get blocked slots without duplicates
async function getBlockedSlots() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        id,
        start_date,
        end_date,
        start_time,
        end_time,
        all_day,
        reason,
        block_type,
        recurring_pattern,
        created_at
      FROM blocked_slots 
      ORDER BY start_date, COALESCE(end_date, start_date), start_time
    `);
    
    // Filter out duplicates in application logic too
    const uniqueSlots = [];
    const seenKeys = new Set();
    
    for (const slot of result.rows) {
      // Create a unique key for this slot
      const key = `${slot.start_date}_${slot.end_date || slot.start_date}_${slot.start_time}_${slot.end_time}_${slot.all_day}_${slot.block_type}_${JSON.stringify(slot.recurring_pattern)}`;
      
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueSlots.push(slot);
      }
    }
    
    return uniqueSlots;
  } finally {
    client.release();
  }
}

async function connectDatabase() {
  try {
    console.log('🔌 Attempting PostgreSQL connection...');
    console.log('Database config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });
    
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully!');
    
    // Test query
    await client.query('SELECT NOW()');
    console.log('✅ Database query test successful');
    
    // Create appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        firstName VARCHAR(50) NOT NULL,
        familyName VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, time)
      )
    `);
    
    console.log('✅ Appointments table ready');
    
    // Create blocked_slots table WITH DATE RANGE SUPPORT
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocked_slots (
        id SERIAL PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE,
        start_time TIME,
        end_time TIME,
        all_day BOOLEAN DEFAULT false,
        reason VARCHAR(255),
        block_type VARCHAR(50) DEFAULT 'single',
        recurring_pattern JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Blocked slots table ready (with date range support)');
    
    // Add unique constraint to prevent duplicates
    try {
      await client.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'unique_blocked_slot_composite'
          ) THEN
            ALTER TABLE blocked_slots 
            ADD CONSTRAINT unique_blocked_slot_composite 
            UNIQUE (start_date, end_date, start_time, end_time, all_day, block_type, recurring_pattern);
          END IF;
        END $$;
      `);
      
      console.log('✅ Unique constraint for blocked slots created');
    } catch (constraintError) {
      console.log('ℹ️  Constraint setup note:', constraintError.message);
    }
    
    // Add indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blocked_slots_date_range 
      ON blocked_slots (start_date, end_date)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_blocked_slots_recurring 
      ON blocked_slots (block_type, (recurring_pattern->>'days'))
    `);
    
    console.log('✅ Blocked slots indexes created');
    
    // Create photos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        filepath VARCHAR(500) NOT NULL,
        caption TEXT,
        category VARCHAR(50) DEFAULT 'portfolio',
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Photos table ready');
    
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
}

module.exports = { 
  connectDatabase, 
  pool,
  addBlockedSlot,
  getBlockedSlots,
  checkExistingBlockedSlot
};
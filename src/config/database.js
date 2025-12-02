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
    
    await client.query(`
    CREATE TABLE IF NOT EXISTS blocked_slots (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      all_day BOOLEAN DEFAULT false,
      reason VARCHAR(255),
      block_type VARCHAR(50) DEFAULT 'single',
      recurring_pattern JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`);
    
    console.log('✅ Blocked slots table ready');
    
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
}

module.exports = { connectDatabase, pool };
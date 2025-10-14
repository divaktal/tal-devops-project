const sqlite3 = require('sqlite3').verbose();

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

module.exports = { connectDatabase };
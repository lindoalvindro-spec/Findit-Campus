const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for hosted databases like Supabase/Neon
  }
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the Supabase database:', err.stack);
  } else {
    console.log('Successfully connected to the Supabase database at:', res.rows[0].now);
  }
});

module.exports = pool;

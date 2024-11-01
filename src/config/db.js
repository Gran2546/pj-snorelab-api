const { Pool } = require('pg');

// Create a new pool instance with PostgreSQL connection details
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'music',
  password: 'postgres',
  port: 5432,
});

// Function to connect to the PostgreSQL database
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected');
    client.release(); // Release the client back to the pool
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
};

module.exports = { pool, connectDB };

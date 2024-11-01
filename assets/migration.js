const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'music',
    password: 'postgres',
    port: 5432 // Adjust if your PostgreSQL uses a different port
});

// Path to the SQL file
const sqlFilePath = path.join(__dirname, 'release1.sql');

// Function to read and execute SQL file
const runSqlFile = async () => {
    try {
        // Connect to the database
        await client.connect();
        console.log('Connected to the database.');

        // Read the SQL file
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        // Execute the SQL commands
        await client.query(sql);
        console.log('SQL file executed successfully.');
    } catch (err) {
        console.error('Error executing SQL file:', err);
    } finally {
        // Close the database connection
        await client.end();
        console.log('Database connection closed.');
    }
};

// Run the function
runSqlFile();

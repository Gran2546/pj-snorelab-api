const bcrypt = require('bcrypt');
const { Pool } = require('pg'); // Make sure to install pg if you haven't already

// Initialize PostgreSQL connection pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'music',
    password: 'postgres',
    port: 5432 // Adjust if your PostgreSQL uses a different port
});

// New passwords for existing users
const usersToUpdate = [
    { email: 'admin@example.com', newPassword: 'new_secure_password' },
    { email: 'johndoe@example.com', newPassword: 'new_user_password' },
];

async function updatePasswords() {
    for (const user of usersToUpdate) {
        const hashedPassword = await bcrypt.hash(user.newPassword, 10); // 10 is the salt rounds

        // Update the user's password in the database
        const query = `
      UPDATE users 
      SET password = $1 
      WHERE email = $2
    `;

        try {
            await pool.query(query, [hashedPassword, user.email]);
            console.log(`Password updated for user: ${user.email}`);
        } catch (error) {
            console.error(`Failed to update password for user ${user.email}:`, error);
        }
    }

    // Close the database connection
    await pool.end();
}

updatePasswords();

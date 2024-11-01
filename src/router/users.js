const express = require('express');
const { pool } = require('../config/db');
const bcrypt = require('bcrypt'); // Ensure you have bcrypt installed for password hashing
const jwt = require('jsonwebtoken'); // Ensure you have jsonwebtoken installed for generating tokens
const router = express.Router();

const JWT_SECRET = 'your_jwt_secret'; // Replace with your actual JWT secret

const queryDatabase = async (query, res) => {
    try {
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// Registration Route
router.post('/register', async (req, res) => {
    const { firstName, lastName, username, email, password } = req.body;

    // Basic validation
    if (!firstName || !lastName || !username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if the user already exists
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const query = `
            INSERT INTO users (firstName, lastName, username, email, password, role_id) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const values = [firstName, lastName, username, email, hashedPassword, 2]; // Assuming role_id 1 for regular users
        const result = await pool.query(query, values);

        const newUser = result.rows[0];

        // Generate a token
        const token = jwt.sign({ userId: newUser.id, role: newUser.role_id }, JWT_SECRET, { expiresIn: '1h' });

        // Respond with user information and the token
        res.status(201).json({
            user: {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                username: newUser.username,
                email: newUser.email,
            },
            token,
        });
    } catch (err) {
        console.error('Error during registration', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all users with pagination and search
router.get('/users', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? req.query.search.toLowerCase() : '';

    const searchTerm = `%${search}%`;

    const query = `
      SELECT 
        u.id AS user_id,
        u.firstName,
        u.lastName,
        u.username,
        u.email,
        u.created_at,
        w.balance,
        w.currency,
        h.action AS last_action,
        h.created_at AS last_action_time,
        CONCAT(u.firstName, ' ', u.lastName) AS fullName
      FROM 
        users u
      LEFT JOIN wallets w ON u.id = w.user_id
      LEFT JOIN (
        SELECT DISTINCT ON (user_id) 
          user_id, action, created_at
        FROM histories
        ORDER BY user_id, created_at DESC
      ) h ON u.id = h.user_id
      WHERE 
        CONCAT(u.firstName, ' ', u.lastName) ILIKE '${searchTerm}' OR u.email ILIKE '${searchTerm}' 
      LIMIT ${10} OFFSET ${offset}
    `;

    await queryDatabase(query, res);
}); 

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND role_id = 2', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role_id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
            },
            token,
        });
    } catch (err) {
        console.error('Error during login', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/email', async (req, res) => {
    const email = req.query.email;

    try {
        // Query the database to find the user by email
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        // Check if user exists
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Respond with user information
        res.status(200).json({
            user: {
                id: user.id,
                firstName: user.firstname,
                lastName: user.lastname,
                username: user.username,
                email: user.email,
            }
        });
    } catch (err) {
        console.error('Error fetching user by email', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

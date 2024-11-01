const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Secret key for JWT (use a more secure key in production)
const JWT_SECRET = 'your_jwt_secret_key';

const queryDatabase = async (query, res) => {
    try {
        const result = await pool.query(query); // Pass parameters to the query
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// History-specific routes
router.get('/admins', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter, default to 1
    const limit = 10; // Define the number of records per page
    const offset = (page - 1) * limit; // Calculate the offset
    const search = req.query.search ? req.query.search.toLowerCase() : ''; // Get the search term from query parameter

    const searchTerm = `%${search}%`;

    const query = `
            SELECT 
            u.id AS user_id,
            u.firstName,
            u.lastName,
            u.email,
            u.username,
            u.created_at,
            u.status,
            CONCAT(u.firstName, ' ', u.lastName) AS fullName,
            r.role_name
        FROM 
            users u
        JOIN 
            roles r ON u.role_id = r.id
        WHERE 
            u.role_id = 1 
            and (CONCAT(u.firstName, ' ', u.lastName) ILIKE '${searchTerm}' OR u.email ILIKE '${searchTerm}')
        LIMIT ${10} OFFSET ${offset}`; 

    await queryDatabase(query, res);
});

router.get('/:id', (req, res) => {
    const historyId = req.params.id;
    res.send(`History details for history ${historyId}`);
});

// Admin login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body; // Assuming you send email and password in the request body

    try {
        // Fetch the admin user by email
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND role_id = 1', [email]); // Role ID 1 for Admin

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Compare provided password with the stored hashed password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate a token
        const token = jwt.sign({ userId: user.id, role: user.role_id }, JWT_SECRET, { expiresIn: '1h' });

        // Respond with user information and the token
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

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Bearer token

    if (!token) {
        return res.sendStatus(403); // Forbidden
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }

        req.user = user;
        next();
    });
};

router.get('/profile', authenticateJWT, (req, res) => {
    // Only admins with a valid token can access this route
    res.status(200).json({ message: 'Welcome, admin!' });
});



module.exports = router;

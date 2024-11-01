const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

const queryDatabase = async (query, res) => {
    try {
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// History-specific routes
router.get('/roles', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter, default to 1
    const limit = 10; // Define the number of records per page
    const offset = (page - 1) * limit; // Calculate the offset
    
    const query = `SELECT * FROM roles LIMIT ${10} OFFSET ${offset}`;
    await queryDatabase(query, res);
});

router.get('/:id', (req, res) => {
    const historyId = req.params.id;
    res.send(`History details for history ${historyId}`);
});

module.exports = router;

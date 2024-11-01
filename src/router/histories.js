const express = require('express');
const { pool } = require('../config/db');
const router = express.Router();

// ฟังก์ชันสำหรับรัน query ในฐานข้อมูล
const queryDatabase = async (query, params, res) => {
    try {
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err.message); // แสดงข้อความของข้อผิดพลาดโดยละเอียด
        res.status(500).json({ error: 'Database error', message: err.message });
    }
};

// ดึงข้อมูล histories พร้อมการแบ่งหน้าและการค้นหา
router.get('/histories', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? req.query.search.toLowerCase() : '';

    const searchTerm = `%${search}%`;
    const query = `SELECT 
        h.id AS history_id,
        h.user_id,
        h.score,
        h.action,
        h.created_at,
        u.firstName,
        u.lastName,
        u.username,
        u.email,
        CONCAT(u.firstName, ' ', u.lastName) AS fullName
        FROM histories h
        JOIN users u ON h.user_id = u.id
        WHERE 
            CONCAT(u.firstName, ' ', u.lastName) ILIKE $1 OR u.email ILIKE $1
        ORDER BY h.created_at DESC
        LIMIT $2 OFFSET $3`;

    const params = [searchTerm, limit, offset];
    await queryDatabase(query, params, res);
});

// สร้าง history record ใหม่
router.post('/histories', async (req, res) => {
    console.log("Request Body:", req.body); // ตรวจสอบข้อมูลที่ได้รับจากฝั่งไคลเอนต์

    const { user_id, score, action } = req.body;

    // ตรวจสอบว่าข้อมูลที่จำเป็นทั้งหมดถูกส่งมาหรือไม่
    if (user_id == null || score == null || !action) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Query สำหรับการเพิ่มข้อมูลใหม่ โดยใช้ Parameterized Query
    const query = `
        INSERT INTO histories (user_id, score, action, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *;
    `;
    const params = [user_id, score, action];

    await queryDatabase(query, params, res);
});

// ดึงข้อมูล history ตาม ID
router.get('/:id', (req, res) => {
    const historyId = req.params.id;
    res.send(`History details for history ${historyId}`);
});

module.exports = router;

const express = require('express');
const { pool } = require('../config/db');
const FormData = require('form-data');
const multer = require('multer');
const router = express.Router();
const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the directory to save files
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Rename the file to avoid name collisions
    },
});

const upload = multer({ storage });

const queryDatabase = async (query, res) => {
    try {
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Database error' });
    }
};

// แก้ไขส่วนนี้เพื่อให้สามารถรับข้อมูลที่อัปเดตแล้ว
router.get('/records', async (req, res) => {
    const page = parseInt(req.query.page) || null;
    const limit = page ? 10 : null;
    const offset = page ? (page - 1) * limit : null;
    const search = req.query.search ? req.query.search.toLowerCase() : '';

    const searchTerm = `%${search}%`;

    let query = `
        SELECT * 
        FROM records 
        WHERE name ILIKE '${searchTerm}' 
    `;

    if (limit !== null && offset !== null) {
        query += `LIMIT ${limit} OFFSET ${offset}`;
    }

    await queryDatabase(query, res);
});

// อัปโหลดไฟล์และบันทึกข้อมูลลงในฐานข้อมูล
router.post('/upload', upload.single('file'), async (req, res) => {
    const { name } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const recordData = {
        mp3_path: file.path,
    };

    const query = `
        INSERT INTO records (name, record_data)
        VALUES ('${name}', '${JSON.stringify(recordData)}') RETURNING *`;

    try {
        await queryDatabase(query, res);
    } catch (error) {
        console.error('Error creating record:', error);
        res.status(500).send('Error creating record.');
    }
});

// อัปโหลดไฟล์ไปยัง FastAPI และรับ URL กราฟจากการตอบกลับ
router.post('/upload-snorelab', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path));

    try {
        const response = await axios.post('http://localhost:8000/detect-snoring', formData, {
            headers: {
                ...formData.getHeaders(),
            }
        });

        // รับข้อมูลการตรวจจับและ URL ของกราฟจากการตอบกลับ
        const { result, graph_url } = response.data;

        res.status(200).json({
            message: "Snoring detection completed.",
            result: result,
            graph_url: `http://localhost:3000${graph_url}`, // ปรับ URL ให้เข้าถึงได้จากไคลเอนต์
            fileName: file.path,
        });
    } catch (error) {
        console.error('Error detecting snoring:', error.response?.data || error.message);
        res.status(500).send('Error detecting snoring.');
    }
});

// ดึงไฟล์เสียงจากเซิร์ฟเวอร์
router.get('/music/:id', async (req, res) => {
    try {
        const data = await fs.readFileSync("uploads/" + req.params.id);

        res.writeHead(200, { "Content-Type": "audio/mpeg" });
        res.end(data);
    } catch (error) {
        res.json({ message: error });
    }
});

// เสิร์ฟหน้า HTML
router.get('/html/:id', async (req, res) => {
    const id = req.params.id;
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ลบไฟล์เสียงในฐานข้อมูล
router.delete('/delete/:id', async (req, res) => {
    const id = req.params.id;

    const query = `
            DELETE FROM records 
            WHERE id = ${id}
        `;

    await queryDatabase(query, res);
});

module.exports = router;
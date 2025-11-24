import express from 'express';
import mysql from 'mysql2/promise';
import fetch from 'node-fetch';

const router = express.Router();

const dbConfig = {
    host: '34.18.164.194',
    user: 'root',
    password: 'Gamer9296',
    database: 'users',
    port: 3306
};

const apiKey = '2cf30ea2bc5543928e6d8cce44572862';
const baseUrl = 'https://api.twelvedata.com/price';

router.get('/price', async (req, res) => {
    const symbol = (req.query.price || '').toUpperCase().trim();
    if (!symbol) return res.status(400).json({ error: 'Missing stock symbol' });

    try {
        const response = await fetch(`${baseUrl}?symbol=${symbol}&apikey=${apiKey}`);
        const data = await response.json();
        res.json({ symbol, price: data.price ? parseFloat(data.price) : 0 });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch live price' });
    }
});

router.post('/transaction', async (req, res) => {
    const { ticker, shares, price, type, user_id } = req.body;

    const sharesNum = parseInt(shares);
    const priceNum = parseFloat(price);
    const userIdNum = parseInt(user_id);

    if (
        !userIdNum ||
        !ticker ||
        isNaN(sharesNum) ||
        isNaN(priceNum) ||
        !['buy', 'sell'].includes(type)
    ) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute(
            'INSERT INTO transactions (ticker, shares, price, type, user_id) VALUES (?, ?, ?, ?, ?)',
            [ticker.toUpperCase().trim(), sharesNum, priceNum, type, userIdNum]
        );
        await conn.end();
        res.json({ success: true });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/transactions', async (req, res) => {
    const user_id = parseInt(req.query.user_id);
    if (!user_id) return res.status(400).json({ error: 'Missing or invalid user_id' });

    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC',
            [user_id]
        );
        await conn.end();
        res.json(rows);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;

import express from 'express';
import mysql from 'mysql2/promise';
import fetch from 'node-fetch';

const router = express.Router();

const dbConfig = {
    host: 'sql12.freesqldatabase.com',
    user: 'sql12804643',
    password: '54NSMjwlGs',
    database: 'sql12804643',
};

const apiKey = '2cf30ea2bc5543928e6d8cce44572862';
const baseUrl = 'https://api.twelvedata.com/price';

router.get('/price', async (req, res) => {
    const symbol = (req.query.price || '').toUpperCase().trim();
    if (!symbol) return res.status(400).json({ error: 'Missing stock symbol' });

    try {
        const response = await fetch(`${baseUrl}?symbol=${symbol}&apikey=${apiKey}`);
        const data = await response.json();
        res.json({ symbol, price: data.price ? parseFloat(data.price) : null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch live price' });
    }
});

router.post('/transaction', async (req, res) => {
    const { ticker, shares, price, type, user_id } = req.body;
    if (!user_id || !ticker || !shares || !price || !['buy', 'sell'].includes(type)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute(
            'INSERT INTO transactions (ticker, shares, price, type, user_id) VALUES (?, ?, ?, ?, ?)',
            [ticker.toUpperCase().trim(), shares, price, type, user_id]
        );
        await conn.end();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
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
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;

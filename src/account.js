// server.js
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcryptjs';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Database connection
const dbConfig = {
    host: 'sql12.freesqldatabase.com',
    user: 'sql12804643',
    password: '54NSMjwlGs',
    database: 'sql12804643',
};

app.post('/auth', async (req, res) => {
    const { action, email, password } = req.body;

    if (!email || !password) return res.json({ success: false, message: 'Email and password required' });

    try {
        const conn = await mysql.createConnection(dbConfig);

        if (action === 'signup') {
            const [rows] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
            if (rows.length > 0) return res.json({ success: false, message: 'Email already registered' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const [result] = await conn.execute('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
            return res.json({ success: true, message: 'User registered', user_id: result.insertId });

        } else if (action === 'signin') {
            const [rows] = await conn.execute('SELECT id, password FROM users WHERE email = ?', [email]);
            if (rows.length === 0) return res.json({ success: false, message: 'User not found' });

            const user = rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) return res.json({ success: true, message: 'Login successful', user_id: user.id });
            return res.json({ success: false, message: 'Invalid credentials' });

        } else {
            return res.json({ success: false, message: 'Invalid action' });
        }

    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: 'Server error' });
    }
});

app.listen(5001, () => console.log('Server running on port 5001'));

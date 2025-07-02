const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

router.post('/create_user', async (req, res) => {

    const { username, email, password } = req.body;
    const user_id = uuidv4();

    console.log("DATI RICEVUTI create_user: " + username + " " + email + " " + password)

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    user_id,
                    username,
                    email,
                    password: hashedPassword,
                }
            ]);

        if (error) {
            // Affido al db il controllo di unicità
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Email o username già registrati' });
            }
            return res.status(500).json({ error: error.message });
        }

        const token = jwt.sign(
            { username, user_id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res
            .cookie('authToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                maxAge: 1000 * 60 * 60 * 72,
            })
            .cookie('username', username, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                maxAge: 1000 * 60 * 60 * 72,
            })
            .cookie('user_id', user_id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                maxAge: 1000 * 60 * 60 * 72,
            })
            .status(201)
            .json({
                message: 'User created successfully',
                userData: { user_id, username, email }
            });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

module.exports = router;

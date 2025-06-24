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
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Email o username già registrati' });
            }
            return res.status(500).json({ error: error.message });
        }

        const token = jwt.sign(
            { username, user_id },
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
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
              user: { user_id, username, email }
            });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});



router.post('/login', async (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('password')
            .eq('username', username);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: 'Username o password errati' });
        }

        const matchPass = await bcrypt.compare(password, data[0].password);

        if (!matchPass) {
            return res.status(404).json({ error: 'Username o password errati' });
        }

        const token = jwt.sign(
            { username: username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'lax',
            maxAge: 1000 * 60 * 60 * 24,
        });

        res.cookie('username', username, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'lax',
            maxAge: 1000 * 60 * 60 * 24,
        });

        return res.status(200).json({ message: 'Login successful' });

    } catch (err) {
        return res.status(500).json({ error: 'Something went wrong during login', details: err.message });
    }

});

module.exports = router;

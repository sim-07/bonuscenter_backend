const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

router.post('/set_used_code', async (req, res) => {
    const { code_id } = req.body;

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

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
        

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

const jwt = require('jsonwebtoken');

router.post('/post_code', async (req, res) => {
    const { title, code, description, brand, bonus_value } = req.body;

    if (!title || !code || !description || !bonus_value) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        if (!user_id) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { data, error } = await supabase
            .from('referral_codes')
            .insert([
                {
                    user_id: user_id,
                    title,
                    brand,
                    code,
                    description,
                    bonus_value,
                }
            ]);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({ message: 'Code added successfully', data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

module.exports = router;

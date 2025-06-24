const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

router.post('/post_code', async (req, res) => {
    const { title, code, description, bonusValue } = req.body;

    if (!title || !code || !description || bonusValue) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Leggere user_id e metterlo nel db

    try {
        const { data, error } = await supabase
            .from('referral_codes')
            .insert([
                {
                    title,
                    code,
                    description,
                    bonusValue,
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
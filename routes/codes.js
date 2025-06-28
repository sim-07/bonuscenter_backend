const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

const jwt = require('jsonwebtoken');

router.post('/post_code', async (req, res) => {
    const { title, name, code, description, brand, bonus_value } = req.body;

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
                    name,
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

router.post('/get_user_codes', async (req, res) => {
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
            .select('*')
            .eq('user_id', user_id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(200).json({ message: 'No referral codes yet', data: [] });
        }

        res.status(200).json({ message: "User codes recovered successfully", data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});


router.post('/get_referral_codes', async (req, res) => {
    const { name } = req.body;

    try {
        const { data, error } = await supabase
            .from('referral_codes')
            .select('*')
            .eq('name', name);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(200).json({ message: 'No referral codes yet', data: [] });
        }

        console.log("DATA get_referral_codes: ", data)

        res.status(200).json({ message: "User codes recovered successfully", data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }

});

module.exports = router;

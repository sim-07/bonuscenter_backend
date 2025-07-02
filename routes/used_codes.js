const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

router.post('/set_used_code', async (req, res) => {
    const { code_id, created_by, bonus_name, bonus_value, bonus_code } = req.body;

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const used_by = decodedData.user_id;

        const { data: existing, error: checkError } = await supabase
            .from('used_codes')
            .select('id')
            .eq('bonus_code', bonus_code)
            .eq('used_by', used_by)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Code already used' });
        }

        const id = uuidv4();

        const { data, error } = await supabase
            .from('used_codes')
            .insert([
                {
                    id,
                    used_by,
                    code_id,
                    created_by,
                    bonus_name,
                    bonus_value,
                    bonus_code,
                    confirmed: false,
                }
            ]);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: "Success" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

router.post('/get_used_code', async (req, res) => {

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        const { data, error } = await supabase
            .from('used_codes')
            .select("*")
            .eq("user_id", user_id)

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ data });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});


module.exports = router;

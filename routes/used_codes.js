const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

router.post('/set_used_code', async (req, res) => { 
    const { code_id, created_by, bonus_name, bonus_value, bonus_code, brand } = req.body;

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const used_by = decodedData.user_id;
        const username = decodedData.username;

        if (created_by == used_by) {
            return res.status(200).json({ message: "Same user" });
        }

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
                    brand,
                    confirmed: false,
                }
            ]);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: "Success", used_by: username });

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
            .eq("used_by", user_id)

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ data });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

router.post('/get_user_used_code', async (req, res) => {

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
            .eq("created_by", user_id)
            .eq("confirmed", true);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ data });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});


router.post('/confirm_code', async (req, res) => { 
    
    const { code_id } = req.body;

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        const { data, error } = await supabase
            .from('used_codes')
            .update({ confirmed: true })
            .eq("created_by", user_id)
            .eq("code_id", code_id)
            .select()

        console.log("Update returned:", data, "error:", error);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ message: "Success" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

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

    const code_id = uuidv4();

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;
        const username = decodedData.username;

        if (!user_id) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        let final_bonus_value = bonus_value.trim();
        if (!final_bonus_value.endsWith("€")) {
            final_bonus_value += "€";
        }

        const { data, error } = await supabase
            .from('referral_codes')
            .insert([
                {
                    code_id: code_id,
                    user_id: user_id,
                    username: username,
                    name,
                    title,
                    brand,
                    code,
                    description,
                    bonus_value: final_bonus_value,
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

router.post('/get_user_code', async (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { code_id } = req.body;

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        if (!user_id) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { data, error } = await supabase
            .from('referral_codes')
            .select('*')
            .eq('code_id', code_id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(200).json({ message: 'No referral code', data: [] });
        }

        res.status(200).json({ message: "User code recovered successfully", data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});


router.post('/get_all_referral_codes', async (req, res) => {
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

        res.status(200).json({ message: "User codes recovered successfully", data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }

});

router.post('/update_code', async (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { code_id, title, name, code, description, brand, bonus_value } = req.body;

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        if (!user_id) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { data: dataUserId, error: errorUserId } = await supabase
            .from('referral_codes')
            .select('user_id')
            .eq('code_id', code_id)
            .single();

        const fetched_user_id = dataUserId.user_id;
        if (fetched_user_id !== user_id || errorUserId) {
            return res.status(500).json({ error: errorUserId ? errorUserId.message : "Action not permitted" });
        }

        const { data: dataUpdate, error: errorUpdate } = await supabase
            .from('referral_codes')
            .update({
                title,
                name,
                code,
                description,
                brand,
                bonus_value
            })
            .eq('code_id', code_id);

        if (errorUpdate) {
            return res.status(500).json({ error: errorUpdate.message });
        }

        res.status(200).json({ message: "Code updated succesfully", dataUpdate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

router.post('/delete_code', async (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { code_id } = req.body;

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        if (!user_id) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!code_id) {
            return res.status(400).json({ error: 'code_id missing' });
        }

        const { data: dataUserId, error: errorUserId } = await supabase
            .from('referral_codes')
            .select('user_id')
            .eq('code_id', code_id)
            .single();

        const fetched_user_id = dataUserId.user_id;
        if (fetched_user_id !== user_id || errorUserId) {
            return res.status(500).json({ error: errorUserId ? errorUserId.message : "Action not permitted" });
        }

        const { error: deleteError } = await supabase
            .from('referral_codes')
            .delete()
            .eq('code_id', code_id);

        if (deleteError) {
            return res.status(500).json({ error: deleteError.message });
        }

        res.status(200).json({ message: "Code deleted succesfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

router.post('/suggest_new_bonus', async (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { bonus_name, bonus_description, bonus_value, note } = req.body;

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        const { data, error } = await supabase
            .from('brand_suggestion')
            .insert([
                {
                    user_id,
                    bonus_name,
                    bonus_description,
                    bonus_value,
                    note,
                }
            ]);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: "Suggest posted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});


module.exports = router;

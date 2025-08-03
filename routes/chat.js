const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseClient');

require('dotenv').config();


router.post('/send_message', async (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { sender_id, receiver_id, text } = req.body;

    const chat_id = [sender_id, receiver_id].sort().join('_');

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;
        const username = decodedData.username;

        if (!user_id || !username || user_id !== sender_id) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { data, error } = await supabase
            .from('chat')
            .insert([
                {
                    chat_id,
                    sender_id,
                    receiver_id,
                    text,
                },
            ]);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

router.post('/get_messages', async (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { sender_id, receiver_id } = req.body;

    const chat_id = [sender_id, receiver_id].sort().join('_');

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;
        const username = decodedData.username;


        
        if (!user_id || !username) {
            console.log("AUTH ERROR: Missing user_id or username in token");
            console.log("user_id:", user_id);
            console.log("username:", username);
            return res.status(401).json({ error: 'Not authorized: missing user data' });
        }

        console.log("DEBUG AUTH CHECK:");
        console.log("User from token (user_id):", user_id);
        console.log("Sender_id from request:", sender_id);
        console.log("Receiver_id from request:", receiver_id);

        if (user_id !== sender_id && user_id !== receiver_id) {
            console.log("AUTH FAIL: user_id does not match sender_id or receiver_id");
            return res.status(401).json({ error: 'Not authorized: user not part of this chat' });
        }




        const { data, error } = await supabase
            .from('chat')
            .select('text, sender_id, receiver_id, created_at')
            .eq('chat_id', chat_id)
            .order('message_id', { ascending: true });

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

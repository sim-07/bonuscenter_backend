const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

router.post('/create_notification', async (req, res) => {
    const { receiver, code_id, type } = req.body;

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;
        const username = decodedData.username;

        if (user_id == receiver) {
            return res.status(200).json({ message: "Same user" });
        }

        let notificationMessage;
        switch (type) {
            case 'used_code':
                const { data: codeData, error: codeError } = await supabase
                    .from('referral_codes')
                    .select('brand')
                    .eq('code_id', code_id)
                    .single();

                if (codeError || !codeData) {
                    return res.status(400).json({ error: 'Invalid code_id' });
                }

                notificationMessage = `🎉 ${username} just copied your ${codeData.brand} code! Make sure they used it correctly and press "Confirm" to validate it.`;
                break;
            case 'new_activity_chat':
                notificationMessage = `ℹ️ New activity in the chat with ${username}`;
                break;
            default:
                notificationMessage = null;
        }

        const notification_id = uuidv4();

        const { error } = await supabase
            .from('notifications')
            .insert([
                {
                    notification_id,
                    receiver,
                    sender: user_id,
                    sender_username: username,
                    code_id, // può essere null
                    type,
                    message: notificationMessage,
                    read: false,
                }
            ]);

        if (error) {
            console.error('Errore in create_notification:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: "Success" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

router.post('/get_notifications', async (req, res) => {

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        const { data, error } = await supabase
            .from('notifications')
            .select("*")
            .eq("receiver", user_id)

        if (error) {
            return res.status(500).json({ error: error.message });
        }


        return res.status(200).json({ data });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

router.post('/get_notifications_not_read', async (req, res) => {

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        const { data, error } = await supabase
            .from('notifications')
            .select("*")
            .eq("receiver", user_id)
            .eq("read", false);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
    
});


router.post('/set_read', async (req, res) => {

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        const { errorRead } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq("receiver", user_id)

        if (errorRead) {
            console.error(errorRead);
        }

        return res.status(200).json({ message: 'Success' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

router.post('/delete_notification', async (req, res) => {
    const { code_id, notification_id } = req.body;

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        let error = null;

        if (code_id) {
            const result = await supabase
                .from('notifications')
                .delete()
                .eq('code_id', code_id)
                .eq('receiver', user_id);

            error = result.error;
        } else if (notification_id) {
            const result = await supabase
                .from('notifications')
                .delete()
                .eq('notification_id', notification_id)
                .eq('receiver', user_id);

            error = result.error;
        } else {
            return res.status(400).json({ error: 'Missing code_id or notification_id' });
        }

        if (error) {
            console.error("Supabase delete error:", error.message);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (err) {
        console.error('JWT or server error:', err);
        return res.status(500).json({ err: 'Something went wrong', details: err.message });
    }
});


module.exports = router;

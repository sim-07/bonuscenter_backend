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

        const { data: codeData, error: codeError } = await supabase
            .from('referral_codes')
            .select('brand')
            .eq('code_id', code_id)
            .single();

        if (codeError || !codeData) {
            return res.status(400).json({ error: 'Invalid code_id' });
        }

        let notificationMessage;
        switch (type) {
            case 'used_code':
                notificationMessage = `🎉 ${username} ha appena copiato il tuo codice ${codeData.brand}! Verifica che lo abbia usato correttamente e premi “Conferma” per validarlo.`
                break;
            default:
                notificationMessage = null;
        }

        const id = uuidv4();

        const { error } = await supabase
            .from('notifications')
            .insert([
                {
                    id,
                    receiver,
                    sender: user_id,
                    code_id, // solo type = used_code, quindi può essere null
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

router.post('/delete_notification', async (req, res) => {
    const { code_id } = req.body;

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('code_id', code_id)
            .eq('receiver', user_id);

        if (error) {
            console.error("Supabase delete error:", error.message);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (err) {
        console.error('JWT or server error:', err);
        return res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});



module.exports = router;

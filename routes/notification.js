const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

router.post('/create_notification', async (req, res) => {
    const { receiver, type, message, read } = req.body;

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const sender = decodedData.user_id;

        const id = uuidv4();

        const { error } = await supabase
            .from('notifications')
            .insert([
                {
                    id,
                    receiver,
                    sender,
                    type, 
                    message,
                    read,
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

// router.post('/get_notifications', async (req, res) => {

//     const token = req.cookies.authToken;
//     if (!token) {
//         return res.status(401).json({ error: 'Not authenticated' });
//     }

//     try {
//         const decodedData = jwt.verify(token, process.env.JWT_SECRET);
//         const user_id = decodedData.user_id;

//         const { data, error } = await supabase
//             .from('used_codes')
//             .select("*")
//             .eq("user_id", user_id)

//         if (error) {
//             return res.status(500).json({ error: error.message });
//         }

//         return res.status(200).json({ data });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Something went wrong', details: err.message });
//     }
// });


module.exports = router;

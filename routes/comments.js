const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

router.post('/get_all_comments', async (req, res) => {
    const { bonusName } = req.body;

    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('bonus_name', bonusName);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(200).json({ message: 'No comments yet', data: [] });
        }

        res.status(200).json({ message: "Comments recovered successfully", data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});

router.post('/post_comment', async (req, res) => {

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Per pubblicare un commento devi prima fare il login' });
    }

    try {
        const { commentText, reply_text, bonusName } = req.body;

        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;
        const username = decodedData.username;

        if (!user_id || !username || !commentText || !bonusName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (commentText.length < 3 || commentText.length > 500) {
            return res.status(400).json({ error: "Il commento deve avere tra 3 e 500 caratteri" });
        }

        const spammy = /(http|https|\.com|www\.|gratis|bitcoin|earn)/i;
        if (spammy.test(commentText)) {
            return res.status(400).json({ error: "Contenuti non consentiti nel commento" });
        }

        const { data: recentComments } = await supabase
            .from('comments')
            .select('created_at')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (recentComments.length > 0) {
            const lastCommentTime = new Date(recentComments[0].created_at).getTime();
            const now = Date.now();
            const secondsSinceLast = (now - lastCommentTime) / 1000;
            if (secondsSinceLast < 15) {
                return res.status(429).json({ error: "Stai commentando troppo velocemente. Attendi qualche secondo." });
            }
        }

        const { data, error } = await supabase
            .from('comments')
            .insert([
                {
                    user_id,
                    username,
                    text: commentText,
                    reply_text: reply_text || null,
                    bonus_name: bonusName,
                }
            ]);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: "Comment posted successfully", data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});


module.exports = router;

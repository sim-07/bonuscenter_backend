const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseClient');

require('dotenv').config();

const { v4: uuidv4 } = require('uuid');

router.post('/create_user', async (req, res) => {

    const { username, email, password } = req.body;
    const user_id = uuidv4();

    console.log("DATI RICEVUTI create_user: " + username + " " + email + " " + password)

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    user_id,
                    username,
                    email,
                    password: hashedPassword,
                }
            ]);

        if (error) {
            // Affido al db il controllo di unicità
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Email o username già registrati' });
            }
            return res.status(500).json({ error: error.message });
        }

        const token = jwt.sign(
            { username, user_id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res
            .cookie('authToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                maxAge: 1000 * 60 * 60 * 72,
            })
            .cookie('username', username, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                maxAge: 1000 * 60 * 60 * 72,
            })
            .cookie('user_id', user_id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                maxAge: 1000 * 60 * 60 * 72,
            })
            .status(201)
            .json({
                message: 'User created successfully',
                userData: { user_id, username, email }
            });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});



router.post('/login', async (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;

    console.log("DATI RICEVUTI LOGIN: " + username + " " + password)

    if (!username || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('user_id, password')
            .eq('username', username);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: 'Username o password errati' });
        }

        const matchPass = await bcrypt.compare(password, data[0].password);

        if (!matchPass) {
            return res.status(404).json({ error: 'Username o password errati' });
        }


        const user_id = data[0].user_id;
        const token = jwt.sign(
            { username: username, user_id: user_id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res
            .cookie('authToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                maxAge: 1000 * 60 * 60 * 72,
            })
            .cookie('username', username, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                maxAge: 1000 * 60 * 60 * 72,
            })
            .cookie('user_id', user_id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                maxAge: 1000 * 60 * 60 * 72,
            })
            .status(201)
            .json({
                message: 'Login successful',
                userData: { user_id, username }
            });


    } catch (err) {
        return res.status(500).json({ error: 'Something went wrong during login', details: err.message });
    }

});

router.post('/get_user_data', async (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;
        const username = decodedData.username;

        if (!user_id || !username) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { data, error } = await supabase
            .from('users')
            .select('username, email, created_at')
            .eq('user_id', user_id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong', details: err.message });
    }
});


router.post('/logout', (req, res) => {
    try {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        };

        res.clearCookie('authToken', cookieOptions);
        res.clearCookie('username', cookieOptions);
        res.clearCookie('user_id', cookieOptions);

        res.status(200).json({ message: "Success" });
    } catch (err) {
        return res.status(500).json({ error: 'Something went wrong during logout', details: err.message });
    }
});

router.post('/delete_account', async (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }


    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decodedData.user_id;

        const { data, error } = await supabase
            .from('users')
            .delete()
            .eq('user_id', user_id)

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        };

        res.clearCookie('authToken', cookieOptions);
        res.clearCookie('username', cookieOptions);
        res.clearCookie('user_id', cookieOptions);

        res.status(200).json({ message: "Success" });
    } catch (err) {
        return res.status(500).json({ error: 'Something went wrong during logout', details: err.message });
    }
})

module.exports = router;

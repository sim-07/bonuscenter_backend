const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const cors = require('cors');
const logger = require('morgan');
require('dotenv').config();

const usersRouter = require('./routes/users');
const codesRouter = require('./routes/codes');
const usedCodesRouter = require('./routes/used_codes');
const notificationRouter = require('./routes/notification');

const app = express();

app.use(logger('dev'));
app.use(cookieParser());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (origin.startsWith(process.env.FRONTEND_URL)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 1000 * 60 * 60 * 72,
  }
});

app.get('/csrf_token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use('/used_codes', csrfProtection, usedCodesRouter);
app.use('/users', csrfProtection, usersRouter);
app.use('/notification', csrfProtection, notificationRouter);
app.use('/codes', csrfProtection, codesRouter);

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid or missing CSRF token' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;

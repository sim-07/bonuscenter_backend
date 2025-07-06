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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

const csrfProtection = csrf({ cookie: true });

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

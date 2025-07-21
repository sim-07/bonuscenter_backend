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
const commentsRouter = require('./routes/comments');

const app = express();

app.use(logger('dev'));
app.use(cookieParser());


app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  exposedHeaders: ['Vary']
}));

app.use((req, res, next) => {
  res.header('Vary', 'Origin, Cookie');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 1000 * 60 * 60 * 72,
    domain: '.bonuscenter.it'
  }
});

app.get('/csrf_token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use('/used_codes', csrfProtection, usedCodesRouter);
app.use('/users', csrfProtection, usersRouter);
app.use('/notification', csrfProtection, notificationRouter);
app.use('/codes', csrfProtection, codesRouter);
app.use('/comments', csrfProtection, commentsRouter);

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid or missing CSRF token' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;

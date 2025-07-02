const cors = require('cors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

var usersRouter = require('./routes/users');
var codesRouter = require('./routes/codes');
var usedCodesRouter = require('./routes/used_codes');
notificationRouter = require('./routes/notification');

var app = express();

app.use(cookieParser());

app.use((req, res, next) => {
  console.log('Cookie:', req.cookies);
  next();
});

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  }));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/codes', codesRouter);
app.use('/users', usersRouter);
app.use('/used_codes', usedCodesRouter);
app.use('/notification', notificationRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;

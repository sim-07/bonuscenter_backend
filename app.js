const cors = require('cors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

var usersRouter = require('./routes/users');
var codesRouter = require('./routes/codes');

var app = express();

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

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

module.exports = app;

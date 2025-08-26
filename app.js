const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const { getMiddleware: getBugsnagMiddleware } = require('./utils/bugsnag');
const { moduleData } = require('./utils/generic');
const ms = require('ms');

const apiRouter = require('./routes/api');

const app = express();

app.set('trust proxy', 'loopback')

app.use(getBugsnagMiddleware().requestHandler)

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('tiny'));
app.use(express.json({ limit: '128mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({ maxAge: ms('1h') }));

app.use('/api', apiRouter);

app.use((req, res, next) => {
  return res.render('index', { title: 'FullFoto', text: `${moduleData.id || '?'} | FullFoto` });
});

module.exports = app;

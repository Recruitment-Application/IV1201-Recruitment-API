'use strict';


const path = require('path');
const APP_ROOT_DIR = path.join(__dirname, '..');

// eslint-disable-next-line no-unused-vars
const result = require('dotenv-safe').config({
    path: path.join(APP_ROOT_DIR, '.env'),
    example: path.join(APP_ROOT_DIR, '.env.example'),
    allowEmptyValues: true,
});

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(express.static(path.join(APP_ROOT_DIR, 'public')));

const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));

app.set('etag', false);

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});


app.get('/', (req, res, next) => {
    try {
        return res.send('Welcome to the RecruitmentAPI');
    } catch (err) {
        next(err);
    }
});

const reqHandlerLoader = require('./api');
reqHandlerLoader.loadHandlers(app);
reqHandlerLoader.loadErrorHandlers(app);

const server = app.listen(
    process.env.SERVER_PORT,
    process.env.SERVER_HOST,
    () => {
        console.log(
            `Server is up at ${server.address().address}:${server.address().port}`,
        );
    },
);

module.exports = server;

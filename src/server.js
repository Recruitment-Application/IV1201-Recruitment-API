'use strict';

const port = 3000

const path = require('path');
const APP_ROOT_DIR = path.join(__dirname, '..');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(express.static(path.join(APP_ROOT_DIR, 'public')));

app.get('/', (req, res) => {
  return res.send('Welcome to the RecruitmentAPI');
});

const server = app.listen(port,
    () => {
      console.log(
          `Server is up at ${server.address().address}:${server.address().port}`
      );
    }
);

module.exports = server;
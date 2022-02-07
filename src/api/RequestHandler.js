'use strict';

const express = require('express');
const Controller = require('../controller/Controller');
const Validators = require('../util/Validators');

class RequestHandler {
    constructor() {
        this.router = express.Router();
    }

    static get URL_PREFIX() {
        return 'http://';
    }

    async fetchController() {
        this.controller = await Controller.createController();
    }

    sendHttpResponse(res, status, body) {
        Validators.isIntegerBetween(status, 200, 501, "status code");
        if (body === undefined) {
            res.status(status).end();
            return;
        }
        let jsonStatus = undefined;
        if (status < 400) {
            jsonStatus = 'success';
        } else {
            jsonStatus = 'fail';
        }
        res.status(status).json({ [jsonStatus]: body });
    }
}

module.exports = RequestHandler;
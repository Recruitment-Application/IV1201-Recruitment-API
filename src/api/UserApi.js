'use strict';

const { check, validationResult } = require('express-validator');
const RequestHandler = require('./RequestHandler');

class UserApi extends RequestHandler {
    constructor() {
        super();
    }

    get path() {
        return UserApi.USER_API_PATH;
    }
    static get USER_API_PATH() {
        return '/user';
    }


    async registerHandler() {
        try {
            await this.fetchController();
            this.router.post(
                '/signin',
                check('username').isAlphanumeric(),
                check('password').not().isEmpty(),
                async (req, res, next) => {
                    try {
                        const errors = validationResult(req);
                         if (!errors.isEmpty()) {
                             this.sendHttpResponse(res, 400, 'Malformed login credentials');
                             return;
                         }
                        const loggedInUserDTO = await this.controller.loginUser(req.body.username, req.body.password);

                        if (loggedInUserDTO === null) {
                            this.sendHttpResponse(res, 401, 'User login failed');
                            return;
                        } else {

                            this.sendHttpResponse(res, 200, loggedInUserDTO);
                            return;
                        }
                    } catch (err) {
                        next(err);
                        
                    }
                },
            );
        } catch (err) {
            console.log(err);
        }
    }

}

module.exports = UserApi;
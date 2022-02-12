'use strict';

const { check, validationResult } = require('express-validator');
const RequestHandler = require('./RequestHandler');
const Validators = require('../util/Validators');
const userErrorCodes = require('../util/userErrCodes');

/**
 * Handles the REST API requests for the user endpoint.
 */
class UserApi extends RequestHandler {
    /**
     * Constructs an instance of {UserApi}.
     */
    constructor() {
        super();
    }

    /**
     * @return {string} The URL paths handled by the user api request handler.
     */
    get path() {
        return UserApi.USER_API_PATH;
    }

    /**
     * @return {string} The URL paths handled by the user api request handler.
     */
    static get USER_API_PATH() {
        return '/user';
    }

    /**
    * Registers the request handling functions.
    */
    async registerHandler() {
        try {
            await this.fetchController();

            /**
             * Signin a user. Handles requests to the signin endpoint.
             * The username and password received in the request are validated.
             * Errors caused by database related issues, are handled by the
             * {UserErrorHandler}.
             * 
             * parameter username: The username is also used as display name and must be alphanumeric.
             * parameter password: The password parameter is used for the authentication process,
             *                     and must have a minimum length of eight.
             * Sends   200: If the user was successfully authenticated, and returns {UserDTO}
             *         400: If the body did not contain a JSON-formatted property
             *             called 'username' and 'password'
             *             or contained malformed data in these properties.
             *         401: If authentication failed.
             * throws  {Error} In case that the {Controller} returns unexpected data.
             */
            this.router.post(
                '/signin',
                check('username').isAlphanumeric(),
                check('password').isLength({ min: 8 }),
                async (req, res, next) => {
                    try {
                        const errors = validationResult(req);
                        if (!errors.isEmpty()) {
                            this.sendHttpResponse(res, 400, errors);
                            return;
                        }
                        const signedinUserDTO = await this.controller.signinUser(req.body.username, req.body.password);

                        if (signedinUserDTO === null) {
                            throw new Error('Expected UserDTO object, received null.');
                        }
                        else if (signedinUserDTO.errorCode !== 0) {
                            this.sendHttpResponse(res, 401, 'User signin failed.');
                            return;
                        }
                        else {
                            this.sendHttpResponse(res, 200, signedinUserDTO);
                            return;
                        }
                    } catch (err) {
                        next(err);

                    }
                },
            );

            /**
             * Signup a user. Handles requests to the signup endpoint.
             * All the fields received in the request are validated.
             * Errors caused by database related issues, are handled by the
             * {UserErrorHandler}.
             * 
             * parameter firstname The new user name.
             * parameter lastname The new user surname.
             * parameter personalNumber The personal number of the new user. 
             *                          It should follow the following format YYYYMMDD-XXXX.
             * parameter email The new user email address.
             * parameter username The username that the new user chose for login.
             * parameter password The password that the new user entered.
             *                     and must have a minimum length of eight.
             * Sends   200: If the user was successfully registered, and returns {UserDTO}
             *         400: If the request body did not contain properly formatted fields.
             * throws  {Error} In case that the {Controller} returns unexpected data.
             */
            this.router.post(
                '/signup',
                check('firstname').isAlpha(),
                check('lastname').isAlpha(),
                check('personalNumber').custom((value) => {
                    if (!Validators.isPersonalNumber(value)) {
                        throw new Error('Invalid personal number.');
                    }
                    // Indicates the success of custom personal number validator
                    return true;
                }),
                check('email').normalizeEmail().isEmail(),
                check('username').isAlphanumeric(),
                check('password').isLength({ min: 8 }),
                async (req, res, next) => {
                    try {
                        const errors = validationResult(req);
                        if (!errors.isEmpty()) {
                            this.sendHttpResponse(res, 400, errors);
                            return;
                        }
                        const signedupUserDTO = await this.controller.signupUser(req.body.firstname, req.body.lastname,
                            req.body.personalNumber, req.body.email, req.body.username, req.body.password);

                        if (signedupUserDTO === null) {
                            throw new Error('Expected UserDTO object, received null.');
                        }
                        else if (signedupUserDTO.errorCode !== 0) {
                            if (signedupUserDTO.errorCode === userErrorCodes.ExistentEmail) {
                                this.sendHttpResponse(res, 400, "E-Mail already exists.");
                            }
                            else if (signedupUserDTO.errorCode === userErrorCodes.ExistentUsername) {
                                this.sendHttpResponse(res, 400, "Username already exists.");
                            }
                            else {
                                this.sendHttpResponse(res, 400, "User signup failed.");
                            }
                        }
                        else {
                            this.sendHttpResponse(res, 200, signedupUserDTO);
                            return;
                        }
                    }

                    catch (err) {
                        next(err);

                    }
                },
            );

        } catch (err) {
            this.logger.logException(err);
        }
    }

}

module.exports = UserApi;
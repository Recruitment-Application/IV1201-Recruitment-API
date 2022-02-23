'use strict';

const {check, validationResult} = require('express-validator');
const RequestHandler = require('./RequestHandler');
const Validators = require('../util/Validators');
const userErrorCodes = require('../util/userErrCodes');
const Authorization = require('./auth/Authorization');

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
             * throws  {Error} In case that the controller returns unexpected data.
             */
            this.router.post(
                '/signin',
                check('username').isAlphanumeric(),
                check('password').isLength({min: 8}),
                async (req, res, next) => {
                    try {
                        const errors = validationResult(req);
                        if (!errors.isEmpty()) {
                            res.clearCookie(Authorization.AUTH_COOKIE_NAME);
                            this.sendHttpResponse(res, 400, errors);
                            return;
                        }
                        const signedinUserDTO = await this.controller.signinUser(req.body.username, req.body.password);

                        if (signedinUserDTO === null) {
                            res.clearCookie(Authorization.AUTH_COOKIE_NAME);
                            throw new Error('Expected UserDTO object, received null.');
                        } else if (signedinUserDTO.errorCode !== userErrorCodes.OK) {
                            res.clearCookie(Authorization.AUTH_COOKIE_NAME);
                            this.sendHttpResponse(res, 401, 'User signin failed.');
                            return;
                        } else {
                            Authorization.setAuthCookie(signedinUserDTO, res);
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
             * throws  {Error} In case that the controller returns unexpected data.
             */
            this.router.post(
                '/signup',
                check('firstname').isAlpha(),
                check('lastname').isAlpha(),
                check('personalNumber').custom((value) => {
                    // This will throw an AssertionError if the validation fails
                    Validators.isPersonalNumberFormat(value, 'personalNumber');
                    // Indicates the success of the custom validator check
                    return true;
                }),
                check('email').normalizeEmail().isEmail(),
                check('username').isAlphanumeric(),
                check('password').isLength({min: 8}),
                async (req, res, next) => {
                    try {
                        const errors = validationResult(req);
                        if (!errors.isEmpty()) {
                            res.clearCookie(Authorization.AUTH_COOKIE_NAME);
                            this.sendHttpResponse(res, 400, errors);
                            return;
                        }
                        const signedupUserDTO = await this.controller.signupUser(req.body.firstname, req.body.lastname,
                            req.body.personalNumber, req.body.email, req.body.username, req.body.password);

                        if (signedupUserDTO === null) {
                            res.clearCookie(Authorization.AUTH_COOKIE_NAME);
                            throw new Error('Expected UserDTO object, received null.');
                        } else if (signedupUserDTO.errorCode !== userErrorCodes.OK) {
                            if (signedupUserDTO.errorCode === userErrorCodes.ExistentEmail) {
                                res.clearCookie(Authorization.AUTH_COOKIE_NAME);
                                this.sendHttpResponse(res, 400, 'E-Mail already exists.');
                            } else if (signedupUserDTO.errorCode === userErrorCodes.ExistentUsername) {
                                res.clearCookie(Authorization.AUTH_COOKIE_NAME);
                                this.sendHttpResponse(res, 400, 'Username already exists.');
                            } else {
                                res.clearCookie(Authorization.AUTH_COOKIE_NAME);
                                this.sendHttpResponse(res, 400, 'User signup failed.');
                            }
                        } else {
                            Authorization.setAuthCookie(signedupUserDTO, res);
                            this.sendHttpResponse(res, 200, signedupUserDTO);
                            return;
                        }
                    } catch (err) {
                        next(err);
                    }
                },
            );

            /**
             * Checks whether a user is signed in or not, by verifying the authentication cookie.
             *
             * Sends   200: If the request contained a valid authentication cookie, the response body
             *              contains the signed in user info.
             *         401: If the authentication cookie was missing or invalid.
             */
            this.router.get(
                '/checkSignin',
                async (req, res, next) => {
                    try {
                        const userDTO = await Authorization.verifyAuthCookie(req, res);
                        if (userDTO === null) {
                            res.clearCookie(Authorization.AUTH_COOKIE_NAME);
                            this.sendHttpResponse(res, 401, 'Missing or invalid authorization cookie.');
                            return;
                        } else {
                            this.sendHttpResponse(res, 200, userDTO);
                            return;
                        }
                    } catch (err) {
                        next(err);
                    }
                },
            );

            /**
             * Signs out a user by clearing the authentication cookie.
             *
             * Sends   200: If the authentication cookie was successfully cleared.
             */
            this.router.get(
                '/signout',
                async (req, res, next) => {
                    try {
                        res.clearCookie(Authorization.AUTH_COOKIE_NAME);
                        this.sendHttpResponse(res, 200, 'Signed out successfully.');
                        return;
                    } catch (err) {
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

'use strict';

const { check, validationResult } = require('express-validator');
const RequestHandler = require('./RequestHandler');
const Authorization = require('./auth/Authorization');
const registrationErrEnum = require('../util/registrationErrEnum');
const Validators = require('../util/Validators');

/**
 * Handles the REST API requests for the job endpoint.
 */
class JobApi extends RequestHandler {
    /**
     * Constructs an instance of {JobApi}.
     */
    constructor() {
        super();
    }

    /**
     * @return {string} The URL paths handled by the job api request handler.
     */
    get path() {
        return JobApi.JOB_API_PATH;
    }

    /**
     * @return {string} The URL paths handled by the job api request handler.
     */
    static get JOB_API_PATH() {
        return '/job';
    }

    /**
    * Registers the request handling functions.
    */
    async registerHandler() {
        try {
            await this.fetchController();

            /**
             * Gets the available jobs and their competences.
             * Errors caused by database related issues, are handled by the
             * {JobErrorHandler}.
             * 
             * Sends   200: If the user was successfully authenticated, and returns {JobDTO}
             *         401: If authentication verification failed.
             * throws  {Error} In case that the controller returns unexpected data.
             */
            this.router.get(
                '/getJobs',
                async (req, res, next) => {
                    try {
                        const userDTO = await Authorization.verifyAuthCookie(req, res);

                        if (userDTO === null) {
                            this.sendHttpResponse(res, 401, "Missing or invalid authorization cookie.");
                            return;
                        }
                        else {
                            const jobDTO = await this.controller.getJobs();
                            if (jobDTO === null) {
                                throw new Error('Expected JobDTO object, received null.');
                            }
                            this.sendHttpResponse(res, 200, jobDTO);
                            return;
                        }
                    } catch (err) {
                        next(err);

                    }
                },
            );

            /**
             * Registers a new job application.
             * Errors caused by database related issues, are handled by the
             * {JobErrorHandler}.
             * 
             * Sends   200: If the application was successfully registered.
             *         400: If the request body did not contain properly formatted fields.
             *         401: If authentication verification fails or the authorization role
             *              of the signed in user is not 'Applicant'.
             * throws  {Error} In case that the controller returns unexpected data.
             */
            this.router.post(
                '/registerApplication',
                check('competence_id').custom((value) => {
                    // This will throw an AssertionError if the validation fails
                    Validators.isPositiveWholeNumber(value, 'competence_id');
                    // Indicates the success of the custom validator check
                    return true;
                }),
                check('years_of_experience').custom((value) => {
                    Validators.isNonNegativeNumber(value, 'years_of_experience');
                    return true;
                }),
                check('date_from').custom((value) => {
                    Validators.isDateFormat(value, 'date_from');
                    return true;
                }),
                check('date_to').custom((value) => {
                    Validators.isDateFormat(value, 'date_to');
                    return true;
                }),
                async (req, res, next) => {
                    try {
                        const errors = validationResult(req);
                        if (!errors.isEmpty()) {
                            this.sendHttpResponse(res, 400, errors);
                            return;
                        }

                        const userDTO = await Authorization.verifyApplicantAuthorization(req);
                        if (userDTO === null) {
                            this.sendHttpResponse(res, 401, "Missing or invalid authorization cookie.");
                            return;
                        }
                        else {
                            const registrationDTO = await this.controller.registerApplication(userDTO.username, req.body.competence_id, req.body.years_of_experience,
                                req.body.date_from, req.body.date_to);

                            if (registrationDTO === null) {
                                throw new Error('Expected RegistrationDTO object, received null.');
                            }
                            if (registrationDTO.errorCode === registrationErrEnum.OK) {
                                this.sendHttpResponse(res, 200, registrationDTO);
                                return;
                            }
                            else if (registrationDTO.errorCode === registrationErrEnum.ExistentApplication) {
                                this.sendHttpResponse(res, 400, "An application with the same information already exists.");
                                return;
                            }
                            else if (registrationDTO.errorCode === registrationErrEnum.InvalidUsername) {
                                this.sendHttpResponse(res, 400, "The username is invalid.");
                                return;
                            }
                            else if (registrationDTO.errorCode === registrationErrEnum.InvalidCompetence) {
                                this.sendHttpResponse(res, 400, "The chosen competence is not a valid competence for this job.");
                                return;
                            }
                        }

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

module.exports = JobApi;
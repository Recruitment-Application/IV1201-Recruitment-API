'use strict';

const {check, validationResult} = require('express-validator');
const RequestHandler = require('./RequestHandler');
const Authorization = require('./auth/Authorization');
const registrationErrEnum = require('../util/registrationErrEnum');
const Validators = require('../util/Validators');
const applicationErrorCodes = require('../util/applicationErrorCodes');

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
                            this.sendHttpResponse(res, 401, 'Missing or invalid authorization cookie.');
                            return;
                        } else {
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
             * This endpoint is only accessible by applicants.
             * Errors caused by database related issues, are handled by the
             * {JobErrorHandler}.
             *
             * parameter competenceId: The competence id and must be a positive whole number.
             * parameter yearsOfExperience: The years of experience and must be a non-negative number.
             * parameter dateFrom: The availability start date and must follow the format (YYYY-MM-DD).
             * parameter dateTo: The availability end date and must follow the format (YYYY-MM-DD).
             *
             * Sends   200: If the application was successfully registered.
             *         400: If the request body did not contain properly formatted fields.
             *         401: If authentication verification fails or the authorization role
             *              of the signed in user is not 'Applicant'.
             * throws  {Error} In case that the controller returns unexpected data.
             */
            this.router.post(
                '/registerApplication',
                check('competenceId').custom((value) => {
                    // This will throw an AssertionError if the validation fails
                    Validators.isPositiveWholeNumber(value, 'competenceId');
                    // Indicates the success of the custom validator check
                    return true;
                }),
                check('yearsOfExperience').custom((value) => {
                    Validators.isNonNegativeNumber(value, 'yearsOfExperience');
                    return true;
                }),
                check('dateFrom').custom((value) => {
                    Validators.isDateFormat(value, 'dateFrom');
                    return true;
                }),
                check('dateTo').custom((value) => {
                    Validators.isDateFormat(value, 'dateTo');
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
                            this.sendHttpResponse(res, 401, 'Missing or invalid authorization cookie.');
                            return;
                        } else {
                            const registrationDTO = await this.controller.registerApplication(userDTO.username, req.body.competenceId, req.body.yearsOfExperience,
                                req.body.dateFrom, req.body.dateTo);

                            if (registrationDTO === null) {
                                throw new Error('Expected RegistrationDTO object, received null.');
                            }
                            if (registrationDTO.errorCode === registrationErrEnum.OK) {
                                this.sendHttpResponse(res, 200, registrationDTO);
                                return;
                            } else if (registrationDTO.errorCode === registrationErrEnum.ExistentApplication) {
                                this.sendHttpResponse(res, 400, 'An application with the same information already exists.');
                                return;
                            } else if (registrationDTO.errorCode === registrationErrEnum.InvalidUsername) {
                                this.sendHttpResponse(res, 400, 'The username is invalid.');
                                return;
                            } else if (registrationDTO.errorCode === registrationErrEnum.InvalidCompetence) {
                                this.sendHttpResponse(res, 400, 'The chosen competence is not a valid competence for this job.');
                                return;
                            }
                        }
                    } catch (err) {
                        next(err);
                    }
                },
            );

            /**
             * Gets a list of existing job applications.
             * Supports filtering and paging, where each page contains 25 applications.
             * This endpoint is only accessible by recruiters.
             * Errors caused by database related issues, are handled by the
             * {JobErrorHandler}.
             *
             * parameter name: The requested first or last name, can be '' in order to ignore the filter by name option.
             * parameter competenceId: The competence id and must be a positive whole number.
             * parameter dateFrom: The availability start date and must follow the format (YYYY-MM-DD),
             *                     can be '' in order to ignore the filter by availability start date option.
             * parameter dateTo: The availability end date and must follow the format (YYYY-MM-DD),
             *                   can be '' in order to ignore the filter by availability end date option.
             * parameter page: The requested page and must be a non-negative whole number (0 to show all applications).
             *
             * Sends   200: If the applications list has been successfully retrieved.
             *         400: If the request body did not contain properly formatted fields.
             *         401: If authentication verification fails or the authorization role
             *              of the signed in user is not 'Recruiter'.
             * throws  {Error} In case that the controller returns unexpected data.
             */
            this.router.get(
                '/listApplications',
                check('name').custom((value) => {
                    // Allow empty name.
                    if (value === '') {
                        return true;
                    }
                    // This will throw an AssertionError if the validation fails
                    Validators.isAlphaString(value, 'name');
                    // Indicates the success of the custom validator check
                    return true;
                }),
                check('competenceId').custom((value) => {
                    Validators.isNonNegativeWholeNumber(value, 'competenceId'); ;
                    return true;
                }),
                check('dateFrom').custom((value) => {
                    // Allow empty dateFrom.
                    if (value === '') {
                        return true;
                    }
                    Validators.isDateFormat(value, 'dateFrom');
                    return true;
                }),
                check('dateTo').custom((value) => {
                    // Allow empty dateTo.
                    if (value === '') {
                        return true;
                    }
                    Validators.isDateFormat(value, 'dateTo');
                    return true;
                }),
                check('page').custom((value) => {
                    Validators.isNonNegativeWholeNumber(value, 'page');
                    return true;
                }),
                async (req, res, next) => {
                    try {
                        const errors = validationResult(req);
                        if (!errors.isEmpty()) {
                            this.sendHttpResponse(res, 400, errors);
                            return;
                        }

                        const userDTO = await Authorization.verifyRecruiterAuthorization(req);
                        if (userDTO === null) {
                            this.sendHttpResponse(res, 401, 'Missing or invalid authorization cookie.');
                            return;
                        } else {
                            const applicationsListDTO = await this.controller.listApplications(req.body.name, req.body.competenceId,
                                req.body.dateFrom, req.body.dateTo, req.body.page);

                            if (applicationsListDTO === null) {
                                throw new Error('Expected ApplicationsListDTO object, received null.');
                            }

                            this.sendHttpResponse(res, 200, applicationsListDTO);
                        }
                    } catch (err) {
                        next(err);
                    }
                },
            );

            /**
             * Gets the job applications total page count.
             * Supports filtering, and a page shall contain 25 applications.
             * This endpoint is only accessible by recruiters.
             * Errors caused by database related issues, are handled by the
             * {JobErrorHandler}.
             *
             * parameter name: The requested first or last name, can be '' in order to ignore the filter by name option.
             * parameter competenceId: The competence id and must be a positive whole number.
             * parameter dateFrom: The availability start date and must follow the format (YYYY-MM-DD),
             *                      can be '' in order to ignore the filter by availability start date option.
             * parameter dateTo: The availability end date and must follow the format (YYYY-MM-DD),
             *                   can be '' in order to ignore the filter by availability end date option.
             *
             * Sends   200: If the applications total page count has been successfully retrieved.
             *         400: If the request body did not contain properly formatted fields.
             *         401: If authentication verification fails or the authorization role
             *              of the signed in user is not 'Recruiter'.
             * throws  {Error} In case that the controller returns unexpected data.
             */
            this.router.get(
                '/getApplicationsPageCount',
                check('name').custom((value) => {
                    // Allow empty name.
                    if (value === '') {
                        return true;
                    }
                    // This will throw an AssertionError if the validation fails
                    Validators.isAlphaString(value, 'name');
                    // Indicates the success of the custom validator check
                    return true;
                }),
                check('competenceId').custom((value) => {
                    Validators.isNonNegativeWholeNumber(value, 'competenceId');
                    return true;
                }),
                check('dateFrom').custom((value) => {
                    // Allow empty dateFrom.
                    if (value === '') {
                        return true;
                    }
                    Validators.isDateFormat(value, 'dateFrom');
                    return true;
                }),
                check('dateTo').custom((value) => {
                    // Allow empty dateTo.
                    if (value === '') {
                        return true;
                    }
                    Validators.isDateFormat(value, 'dateTo');
                    return true;
                }),
                async (req, res, next) => {
                    try {
                        const errors = validationResult(req);
                        if (!errors.isEmpty()) {
                            this.sendHttpResponse(res, 400, errors);
                            return;
                        }

                        const userDTO = await Authorization.verifyRecruiterAuthorization(req);
                        if (userDTO === null) {
                            this.sendHttpResponse(res, 401, 'Missing or invalid authorization cookie.');
                            return;
                        } else {
                            const pageCount = await this.controller.getApplicationsPageCount(req.body.name, req.body.competenceId,
                                req.body.dateFrom, req.body.dateTo);
                            const pageCountObject = {'pageCount': pageCount};
                            if (pageCount === null) {
                                throw new Error('Expected pageCount, received null.');
                            }

                            this.sendHttpResponse(res, 200, pageCountObject);
                        }
                    } catch (err) {
                        next(err);
                    }
                },
            );

            /**
             * Gets detailed information about a specific job application
             * This endpoint is only accessible by recruiters.
             * Errors caused by database related issues, are handled by the
             * {JobErrorHandler}.
             *
             * parameter applicationId: The requested application's ID, must be an integer.
             *
             * Sends   200: If the applications was successfully retrieved.
             *         400: If the request body did not contain properly formatted fields
             *              or contained an invalid or non-existent application ID.
             *         401: If authentication verification fails or the authorization role
             *              of the signed in user is not 'Recruiter'.
             * throws  {Error} In case that the controller returns unexpected data.
             */
            this.router.get(
                '/getApplication',
                check('applicationId').isInt(),
                async (req, res, next) => {
                    try {
                        const errors = validationResult(req);
                        if (!errors.isEmpty()) {
                            this.sendHttpResponse(res, 400, errors);
                            return;
                        }

                        const userDTO = await Authorization.verifyRecruiterAuthorization(req);

                        if (userDTO === null) {
                            this.sendHttpResponse(res, 401, 'Missing or invalid authorization cookie.');
                            return;
                        } else {
                            const applicationDTO = await this.controller.getApplication(req.body.applicationId);
                            if (applicationDTO === null) {
                                throw new Error('Expected ApplicationDTO object, received null.');
                            }
                            if (applicationDTO.errorCode === applicationErrorCodes.OK) {
                                this.sendHttpResponse(res, 200, applicationDTO);
                                return;
                            } else if (applicationDTO.errorCode === applicationErrorCodes.InvalidID) {
                                this.sendHttpResponse(res, 400, 'Invalid or non-existent application ID.');
                                return;
                            }

                            return;
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

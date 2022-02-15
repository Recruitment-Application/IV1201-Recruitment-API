'use strict';

const RequestHandler = require('./RequestHandler');
const Authorization = require('./auth/Authorization');

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

        } catch (err) {
            this.logger.logException(err);
        }
    }

}

module.exports = JobApi;
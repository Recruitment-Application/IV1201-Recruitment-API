'use strict';

const ErrorHandler = require('./ErrorHandler');

/**
 * Handles general errors by endpoints that don't implement
 * error handlers.
 * This class is the last resort for handling express endpoint
 * errors.
 */
class ErrorResponseSender extends ErrorHandler {
    /**
   * Constructs a new instance of the {ErrorResponseSender}, and passes the log filename
   * to the superclass.
   */
    constructor() {
        super('GeneralErrorHandler');
    }

    /**
   * @return {string} The URL paths handled by the error handler.
   */
    get path() {
        return '/';
    }

    /**
   * Registers the error handler
   * @param {Application} app The express application that will host the error handlers.
   */
    registerHandler(app) {
        app.use(this.path, (err, req, res, next) => {
            this.logger.logException(err);
            if (res.headersSent) {
                return next(err);
            }
            res.status(500).send({error: 'The server encountered an unhandled error.'});
        });
    }
}

module.exports = ErrorResponseSender;

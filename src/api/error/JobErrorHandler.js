'use strict';

const ErrorHandler = require('./ErrorHandler');

/**
 * Handles errors caused by the {JobApi} endpoints.
 */
class JobErrorHandler extends ErrorHandler {

   /**
   * Constructs a new instance of the {JobErrorHandler}, and passes the log filename
   * to the superclass.
   */
  constructor() {
    super("JobApi");
  }

  /**
   * @return {string} The URL paths handled by the error handler.
   */
  get path() {
    return '/job/';
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
      res.status(503).send({error: 'The job service is unavailable.'});
    });
  }
}

module.exports = JobErrorHandler;

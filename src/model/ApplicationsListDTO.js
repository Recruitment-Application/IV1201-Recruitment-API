'use strict';

const Validators = require('../util/Validators');
/**
 * Representing the information about the filtered applications.
 */
class ApplicationsListDTO {
    /**
   * Create an instance of the applications that were filtered.
   * @param {[{applicationID, firstName, lastName}]} applications An array of objects representing
   *                                                  the info about the filtered application.
   */
    constructor(applications) {
        applications.forEach((application) => Validators.isApplication(application, 'Application'));
        this.applications = applications;
    }
}

module.exports = ApplicationsListDTO;

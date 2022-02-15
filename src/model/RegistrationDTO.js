'use strict';

const Validators = require('../util/Validators');

/**
 * Represent the registration confirmation of the new application of the user.
 */
 class RegistrationDTO {
  /**
   * Create an instance of the registration confirmation result.
   * @param {Integer} applicationID The application ID for the new registered application.
   *                                It will get the application id for the existent 
   *                                 application in case it is found. 0 in case something went
   *                                 wrong.
   * @param {Integer} errorCode The code that represents one of the errors that happened through
   *                            the registration process, it is an enumeration found in 
   *                            registrationErrEnum.js.
   */
  constructor(applicationID, errorCode) {
    Validators.isNonNegativeWholeNumber(applicationID, 'Application ID');
    this.applicationID = applicationID;
    this.errorCode = errorCode;
  }
}

module.exports = RegistrationDTO;
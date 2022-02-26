'use strict';

const Validators = require('../util/Validators');

/**
 * Represents the information related to the application.
 */
class ApplicationDTO {
    /**
   * Create an instance with the related info about the specified application.
   * @param {Integer} applicationID The id for the application.
   * @param {String} firstName The first name of the person that the application belongs to.
   * @param {String} lastName The last name of the person that the application belongs to.
   * @param {{id, type}} competence The competence that is related to the application.
   * @param {Float} yearsOfExperience The year of experience that the person has in the
   *                                  related competence.
   * @param {Date} dateFrom The start date that the person is available.
   * @param {Date} dateTo The end date that the person is available.
   * @param {String} decision The decision that is taken regarding the application.
   * @param {Integer} errorCode The code represent the state of the result.
   *                      It is either Unhandled, Accepted or Rejected.
   */
    constructor(applicationID, firstName, lastName, competence, yearsOfExperience,
        dateFrom, dateTo, decision, errorCode) {
        Validators.isPositiveWholeNumber(applicationID, 'Application ID');
        Validators.isAlphaString(firstName, 'First Name');
        Validators.isAlphaString(lastName, 'Last Name');
        Validators.isCompetence(competence, 'Competence');
        Validators.isNonNegativeNumber(yearsOfExperience, 'Years of Experience');
        Validators.isDateFormat(dateFrom, 'From Date');
        Validators.isDateFormat(dateTo, 'To Date');
        Validators.isDecision(decision, 'Decision');
        this.applicationID = applicationID;
        this.firstName = firstName;
        this.lastName = lastName;
        this.competence = competence;
        this.yearsOfExperience = yearsOfExperience;
        this.dateFrom = dateFrom;
        this.dateTo = dateTo;
        this.decision = decision;
        this.errorCode = errorCode;
    }
}

module.exports = ApplicationDTO;

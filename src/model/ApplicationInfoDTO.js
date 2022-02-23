'use strict';

const Validators = require('../util/Validators');
/**
 * Representing the information for registering a new application for an applicant.
 */
class ApplicationInfoDTO {
    /**
   * Create an instance of a new application for and applicant.
   * @param {String} username The username of the user.
   * @param {Integer} competenceID The competence id for the related job.
   * @param {Float} yearsOfExperience The year of experience that the user has with the competence.
   * @param {Date} dateFrom The start date that the user is available.
   * @param {Date} dateTo The end date that the user is available.
   */
    constructor(username, competenceID, yearsOfExperience, dateFrom, dateTo) {
        Validators.isAlphanumericString(username, 'Username');
        Validators.isPositiveWholeNumber(competenceID, 'Competence ID');
        Validators.isNonNegativeNumber(yearsOfExperience, 'Years of Experience');
        Validators.isDateFormat(dateFrom, 'Date From');
        Validators.isDateFormat(dateTo, 'Date To');
        this.username = username;
        this.competenceID = competenceID;
        this.yearsOfExperience = yearsOfExperience;
        this.dateFrom = dateFrom;
        this.dateTo = dateTo;
    }
}

module.exports = ApplicationInfoDTO;

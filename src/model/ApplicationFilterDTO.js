'use strict';

const Validators = require('../util/Validators');
/**
 * Representing the information for filtering the application list.
 */
class ApplicationFilterDTO {
  /**
   * Create an instance of the filtering parameters for getting application list.
   * Note that the empty value enumeration are found in filterEmptyParamEnum.js.
   * @param {String} username The name of the person. NONE string will represent an empty name.
   * @param {Integer} competenceID The competence id for the related job. 
   *                               0 will represent an empty competence id.
   * @param {Date} dateFrom The start date that the person is available.
   *                        0001-01-01 date will represent an empty start date.
   * @param {Date} dateTo The end date that the person is available. 
   *                      0001-01-01 date will represent an empty end date.
   * @param {Integer} page The page number for the application list, each page will show 
   *                       specific number of applications. 0 value for getting all the applications.
   */
  constructor(name, competenceID, dateFrom, dateTo, page) {
    Validators.isAlphaString(name, 'Name');
    Validators.isNonNegativeWholeNumber(competenceID, 'Competence ID');
    Validators.isDataFormat(dateFrom, 'Date');
    Validators.isDataFormat(dateTo, 'Date');
    Validators.isNonNegativeWholeNumber(page, 'Page Number');
    this.name = name;
    this.competenceID = competenceID;
    this.dateFrom = dateFrom;
    this.dateTo = dateTo;
    this.page = page;
  }
}

module.exports = ApplicationFilterDTO;
'use strict';

const Validators = require('../util/Validators');
/**
 * Representing the job and the respective competences related to it.
 */
class JobDTO {
    /**
   * Create an instance of the job with the related competences.
   * @param {Integer} jobID The id related to the job.
   * @param {String} description The name of the job.
   * @param {[{id, type}]} competences An array holding all the competences with
   *                                     objects that have the id and type of the competence.
   */
    constructor(jobID, description, competences) {
        Validators.isPositiveWholeNumber(jobID, 'Job ID');
        Validators.isDescriptionString(description, 'Job description');
        competences.forEach((competence) => Validators.isCompetence(competence, 'Competence'));
        this.jobID = jobID;
        this.description = description;
        this.competences = competences;
    }
}

module.exports = JobDTO;

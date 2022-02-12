'use strict';

/**
 * Representing the job and the respective competences related to it.
 */
class JobDTO {
  /**
   * Create an instance of the job with the related competences.
   * @param {Integer} jobID The id related to the job.
   * @param {String} description The name of the job.
   * @param {{"id", "type"}} competences An array holding all the competences with 
   *                                     objects that have the id and type of the competence.
   */
  constructor(jobID, description, competences) {
    this.jobID = jobID;
    this.description = description;
    this.competences = competences;
  }
}

module.exports = JobDTO;
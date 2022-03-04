'use strict';

const RecruitmentDAO = require('../integration/RecruitmentDAO');
const SignupDTO = require('../model/SignupDTO');
const ApplicationInfoDTO = require('../model/ApplicationInfoDTO');
const ApplicationFilterDTO = require('../model/ApplicationFilterDTO');
const filterEmptyParamEnum = require('../util/filterEmptyParamEnum');

/**
 * The application's controller.
 * Only this class should call the model and integration layers.
 */
class Controller {
    /**
     * Constructs an instance of {Controller}.
     * Also creates an instance of the {RecruitmentDAO}.
     */
    constructor() {
        this.recruitmentDAO = new RecruitmentDAO();
    }

    /**
     * Creates a new instance of the controller,
     * and establishes a connection to the database,
     * and returns the newly created instance of the controller.
     *
     * @return {Controller} The newly created controller.
     */
    static async createController() {
        const controller = new Controller();
        await controller.recruitmentDAO.establishConnection();
        return controller;
    }

    /**
     * Signs in a user. This method issues a call to the signinUser method in the {RecruitmentDAO},
     * which either returns a {UserDTO} with the result of the authentication or null in case of an error
     * while contacting the database.
     *
     * @param {string} username The username of the user that is signing in.
     * @param {string} password The password of the user that is signing in.
     * @return {UserDTO|null} The signed in user's UserDTO or null in case an error
     *                         while contacting the database.
     */
    async signinUser(username, password) {
        const userDTO = await this.recruitmentDAO.signinUser(username, password);
        return userDTO;
    }

    /**
     * Signs up a user. This method issues a call to the signupUser method in the {RecruitmentDAO},
     * which either returns a {UserDTO} with the result of the authentication or null in case of an error
     * while contacting the database.
     *
     * @param {String} firstName The new user name.
     * @param {String} lastName The new user surname.
     * @param {String} personalNumber The personal number of the new user.
     *                                It should follow the following format YYYYMMDD-XXXX.
     * @param {String} email The new user email address.
     * @param {String} username The username that the new user chose for login.
     * @param {String} password The password that the new user entered.
     * @return {UserDTO | null} The signed up user's UserDTO or null in case of an error
     *                         while contacting the database.
     */
    async signupUser(firstName, lastName, personalNumber, email, username, password) {
        const signupDTO = new SignupDTO(firstName, lastName, personalNumber, email, username, password);
        const userDTO = await this.recruitmentDAO.signupUser(signupDTO);
        return userDTO;
    }

    /**
     * Gets the available jobs and their competences. This method issues a call to the getJobs method in the {RecruitmentDAO},
     * which either returns a {JobDTO} which contains description of the available jobs and their respective competences
     * or null in case of an error while contacting the database.
     *
     * @return {JobDTO | null} The available jobs {JobDTO} or null in case of an error
     *                         while contacting the database.
     */
    async getJobs() {
        const jobDTO = await this.recruitmentDAO.getJobs();
        return jobDTO;
    }

    /**
     * Registers a new job application. This method issues a call to the registerNewApplication method in the {RecruitmentDAO},
     * which either returns a {RegistrationDTO} that contains information about application registration
     * or null in case of an error while contacting the database.
     *
     * @param {string} username The username of the applicant.
     * @param {number} competenceId The competence id.
     * @param {number} yearsOfExperience The years of experience in the specified competence.
     * @param {string} dateFrom The availability date range start.
     * @param {string} dateTo The availability date range end.
     * @return {RegistrationDTO | null} The application registration result {RegistrationDTO} or null
     *                                   in case of an error while contacting the database.
     */
    async registerApplication(username, competenceId, yearsOfExperience, dateFrom, dateTo) {
        const applicationInfoDTO = new ApplicationInfoDTO(username, competenceId, yearsOfExperience,
            dateFrom, dateTo);
        const registrationDTO = await this.recruitmentDAO.registerNewApplication(applicationInfoDTO);

        return registrationDTO;
    }


    /**
     * Gets a list of existing job applications,
     * Supports filtering and paging, where each page contains 25 applications.
     * returns an {ApplicationsListDTO} that contains information about the registered applications
     * or null in case of an error while contacting the database.
     *
     * @param {string} name The requested first or last name, can be '' in order to ignore the filter by name option.
     * @param {number} competenceId The competence id and must be a positive whole number.
     * @param {string} dateFrom The availability start date and must follow the format (YYYY-MM-DD),
     *                          can be '' in order to ignore the filter by availability start date option.
     * @param {string} dateTo The availability end date and must follow the format (YYYY-MM-DD),
     *                        can be '' in order to ignore the filter by availability end date option.
     * @param {number} page The requested page and must be a non-negative whole number (0 to show all applications).
     * @return {ApplicationsListDTO | null} The applications list result {ApplicationsListDTO} or null
     *                                       in case of an error while contacting the database.
     */
    async listApplications(name, competenceId, dateFrom, dateTo, page) {
        const applicationFilterDTO = await this._createApplicationFilterDTO(name, competenceId, dateFrom, dateTo, page);
        const applicationsListDTO = await this.recruitmentDAO.getApplicationsList(applicationFilterDTO);

        return applicationsListDTO;
    }

    /**
     * Gets the job applications total page count.
     * Supports filtering, each page shall contain 25 applications.
     * returns a {number} that contains the total job applications page count
     * for the specified filter options or null in case of an error while contacting the database.
     *
     * @param {string} name The requested first or last name, can be '' in order to ignore the filter by name option.
     * @param {number} competenceId The competence id and must be a positive whole number.
     * @param {string} dateFrom The availability start date and must follow the format (YYYY-MM-DD),
     *                          can be '' in order to ignore the filter by availability start date option.
     * @param {string} dateTo The availability end date and must follow the format (YYYY-MM-DD),
     *                        can be '' in order to ignore the filter by availability end date option.
     * @return {number | null} The total job applications page count or null
     *                          in case of an error while contacting the database.
     */
    async getApplicationsPageCount(name, competenceId, dateFrom, dateTo) {
        const applicationFilterDTO = await this._createApplicationFilterDTO(name, competenceId, dateFrom, dateTo, 0);
        const pageCount = await this.recruitmentDAO.getPageCount(applicationFilterDTO);
        return pageCount;
    }

    /**
     * Gets detailed information regarding a specific job application.
     *
     * @param {number} applicationId The requested application's ID, must be a positive integer.
     * @return {ApplicationDTO | null} The detailed application information or null
     *                                 in case of an error while contacting the database.
     */
    async getApplication(applicationId) {
        const applicationDTO = await this.recruitmentDAO.getApplication(applicationId);
        return applicationDTO;
    }


    /**
     * Submits a decision regarding a specific job application.
     *
     * @param {string} username The username of the recruiter taking the decision.
     * @param {number} applicationId The job application's ID, must be a positive integer.
     * @param {string} decision The taken decision, must be either 'Unhandled', 'Accepted' or 'Rejected'.
     * @return {DecisionDTO | null} The registered decision for the application or null
     *                              in case of an error while contacting the database.
     */
    async submitApplicationDecision(username, applicationId, decision) {
        const decisionDTO = await this.recruitmentDAO.submitApplicationDecision(username, applicationId, decision);
        return decisionDTO;
    }

    // eslint-disable-next-line require-jsdoc
    async _createApplicationFilterDTO(name, competenceId, dateFrom, dateTo, page) {
        let requestedName = name;
        let requestedDateForm = dateFrom;
        let requestedDateTo = dateTo;
        let requestedCompetenceId = parseInt(competenceId);
        let requestedPage = parseInt(page);
        if (name === '') {
            requestedName = filterEmptyParamEnum.Name;
        }
        if (requestedDateForm === '') {
            requestedDateForm = filterEmptyParamEnum.Date;
        }
        if (requestedDateTo === '') {
            requestedDateTo = filterEmptyParamEnum.Date;
        }
        if(competenceId === 0){
            requestedCompetenceId = filterEmptyParamEnum.CompetenceID;
        }
        if(page === 0){
            requestedPage = filterEmptyParamEnum.Page;
        }
        const applicationFilterDTO = new ApplicationFilterDTO(requestedName, requestedCompetenceId, requestedDateForm, requestedDateTo, requestedPage);
        return applicationFilterDTO;
    }
}

module.exports = Controller;

'use strict';

const RecruitmentDAO = require('../integration/RecruitmentDAO');
const SignupDTO = require('../model/SignupDTO');
const ApplicationInfoDTO = require('../model/ApplicationInfoDTO')
const ApplicationFilterDTO = require('../model/ApplicationFilterDTO')
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
     * @returns {UserDTO|null} The signed in user's UserDTO or null in case an error 
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
     * @returns {UserDTO | null} The signed up user's UserDTO or null in case of an error 
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
     * @returns {JobDTO | null} The available jobs {JobDTO} or null in case of an error 
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
     * @returns {RegistrationDTO | null} The application registration result {RegistrationDTO} or null 
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
     * @returns {ApplicationsListDTO | null} The applications list result {ApplicationsListDTO} or null 
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
     * @returns {number | null} The total job applications page count or null
     *                          in case of an error while contacting the database.
     */
    async getApplicationsPageCount(name, competenceId, dateFrom, dateTo) {
        const applicationFilterDTO = await this._createApplicationFilterDTO(name, competenceId, dateFrom, dateTo, 0);
        const pageCount = await this.recruitmentDAO.getPageCount(applicationFilterDTO);
        return pageCount;
    }

    async _createApplicationFilterDTO(name, competenceId, dateFrom, dateTo, page) {
        let requestedName = name;
        let requestedDateForm = dateFrom;
        let requestedDateTo = dateTo;
        if (name === '') {
            requestedName = filterEmptyParamEnum.Name;
        }
        if (requestedDateForm === '') {
            requestedDateForm = filterEmptyParamEnum.Date;
        }
        if (requestedDateTo === '') {
            requestedDateTo = filterEmptyParamEnum.Date;
        }
        const applicationFilterDTO = new ApplicationFilterDTO(requestedName, competenceId, requestedDateForm, requestedDateTo, page);
        return applicationFilterDTO;
    }


}

module.exports = Controller;

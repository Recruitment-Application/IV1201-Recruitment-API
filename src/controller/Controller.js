'use strict';

const RecruitmentDAO = require('../integration/RecruitmentDAO');
const SignupDTO = require('../model/SignupDTO');

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
     * @returns {UserDTO|null} The signed up user's UserDTO or null in case an error 
     *                         while contacting the database.
     */
    async signupUser(firstName, lastName, personalNumber, email, username, password) {
        let signupDTO = new SignupDTO(firstName, lastName, personalNumber, email, username, password);
        const userDTO = await this.recruitmentDAO.signupUser(signupDTO);
        return userDTO;
    }

}

module.exports = Controller;

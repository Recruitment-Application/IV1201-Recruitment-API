'use strict';

const Validators = require('../util/Validators');
/**
 * Representing the new user information.
 */
class SignupDTO {
    /**
   * Create an instance to hold the information about the new user.
   * @param {String} firstName The new user name.
   * @param {String} lastName The new user surname.
   * @param {String} personalNumber The personal number of the new user.
   *                                It should follow the following format YYYYMMDD-XXXX.
   * @param {String} email The new user email address.
   * @param {String} username The username that the new user chose for login.
   * @param {String} password The password that the new user entered.
   */
    constructor(firstName, lastName, personalNumber, email, username, password) {
        Validators.isAlphaString(firstName, 'First name');
        Validators.isAlphaString(lastName, 'Last name');
        Validators.isPersonalNumberFormat(personalNumber, 'Personal number');
        Validators.isEmailFormat(email, 'Email');
        Validators.isAlphanumericString(username, 'Username');
        this.firstName = firstName;
        this.lastName = lastName;
        this.personalNumber = personalNumber;
        this.email = email;
        this.username = username;
        this.password = password;
    }
}

module.exports = SignupDTO;

'use strict';

const Validators = require('../util/Validators');
/**
 * Representing the user incase they are logged in.
 */
class UserDTO {
  /**
   * Create an instance of the logged in user.
   * @param {String} username The username for the user.
   * @param {Integer} roleID The role that the user has, which could be
   *                         either a recruiter, an applicant or invalid.
   *                         The roles are given in the rolesEnum.js.
   * @param {Integer} errorCode The code represent the state of the result.
   *                            0 is for success, 1 for login error, the error 
   *                            are enumerated in userErrorEnum.js.
   */
  constructor(username, roleID, errorCode) {
    Validators.isAlphanumericString(username, 'username');
    Validators.isIntegerBetween(roleID, 0, 2, 'roleID');
    this.username = username;
    this.roleID = roleID;
    this.errorCode = errorCode;
  }
}

module.exports = UserDTO;
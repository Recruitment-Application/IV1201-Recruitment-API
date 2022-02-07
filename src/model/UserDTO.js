'use strict';

const Validators = require('../util/Validators');

class UserDTO {
  constructor(username, roleID) {
    Validators.isAlphanumericString(username, 'username');
    Validators.isIntegerBetween(roleID, 1, 2, 'roleID');
    this.username = username;
    this.roleID = roleID;
  }
}

module.exports = UserDTO;
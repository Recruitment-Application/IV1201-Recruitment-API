'use strict';

class UserDTO {
  constructor(username, roleID) {
    validators.isAlphanumericString(username, 'username');
    validators.isIntegerBetween(roleID, 1, 2, 'roleID');
    this.username = username;
    this.roleID = roleID;
  }
}

module.exports = UserDTO;
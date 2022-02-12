'use strict';

const { Client } = require('pg');
const pbkdf2 = require('pbkdf2');
const UserDTO = require('../model/UserDTO');
const recruitmentRoles = require('../util/rolesEnum');
const userErrorCode = require('./userErrEnum');

/**
 * Responsible for the database management.
 * Calls ranging from executing, updating and inserting.
 */
class RecruitmentDAO {
  /**
   * Create an instance of the class with the credentials needed for the database connection. 
   */
  constructor() {
    this.client = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: process.env.DB_PORT,
      ssl: { rejectUnauthorized: false }
    });
  }

  /**
   * Establish the connection to the database with the credentials.
   */
  async establishConnection() {
    try {
      await this.client.connect();
    } catch (err) {
      console.log(err.stack);
    }
  }

  /**
   * Check whether the information of the login are correct.
   * @param {String} username The username of the profile.
   * @param {String} password The password related to the user.
   * @returns {UserDTO | null} On object containing the username and the role of the user
   *                           The role ID is either 0 for Invalid, 1 for Recruiter, 
   *                            2 for Applicant. The object is null incase something went wrong.     
   */
  async signinUser(username, password) {
    const passwordHash = await this._generatePasswordHash(username, password);

    const checkLoginQuery = {
      text: `SELECT login_info.username, person.role_id
            FROM    login_info
                    INNER JOIN person ON (login_info.person_id = person.id)
            WHERE   login_info.username = $1 AND
                    login_info.password = $2`,
      values: [username, passwordHash],
    };

    try {
      await this.client.query('BEGIN');

      const results = await this.client.query(checkLoginQuery);

      let retValue;
      if (results.rowCount <= 0) {
        retValue = new UserDTO(username, recruitmentRoles.Invalid, userErrorCode.LoginFailure);
      }
      else {
        retValue = new UserDTO(results.rows[0].username, results.rows[0].role_id, userErrorCode.OK);
      }

      await this.client.query('COMMIT');
      return retValue;
    } catch (err) {
      await this.client.query('ROLLBACK');
      console.log("Signin Error\n", err.stack);
      return null;
    }
  }

  async _generatePasswordHash(username, password) {
    let globalSalt = process.env.GLOBAL_SALT;
    let userSalt = globalSalt.concat("_", username);
    let derivedKeyBuffer = pbkdf2.pbkdf2Sync(password, userSalt, 25, 32, 'sha512');
    let hexBuffer = Buffer.from(derivedKeyBuffer, 'utf8');
    return hexBuffer.toString('hex');
  }
}

module.exports = RecruitmentDAO;
'use strict';

const { Client } = require('pg');
const pbkdf2 = require('pbkdf2');
const UserDTO = require('../model/UserDTO');
const SignupDTO = require('../model/SignupDTO');
const recruitmentRoles = require('../util/rolesEnum');
const userErrorCodes = require('../util/userErrCodes');
const JobDTO = require('../model/JobDTO');

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
        retValue = new UserDTO(username, recruitmentRoles.Invalid, userErrorCodes.LoginFailure);
      }
      else {
        retValue = new UserDTO(results.rows[0].username, results.rows[0].role_id, userErrorCodes.OK);
      }

      await this.client.query('COMMIT');
      return retValue;
    } catch (err) {
      await this.client.query('ROLLBACK');
      console.log("Signin Error\n", err.stack);
      return null;
    }
  }

  /**
   * Take the new user information and make entries in the database if the user is new.
   * @param {SignupDTO} signupDTO The needed info about the new user.
   * @returns {UserDTO | null} On object containing the username and the role of the user
   *                           The role ID is either 0 for Invalid, 1 for Recruiter, 
   *                            2 for Applicant. The object is null incase something went wrong.
   */
  async signupUser(signupDTO) {
    const passwordHash = await this._generatePasswordHash(signupDTO.username, signupDTO.password);
    
    const checkEmailQuery = {
      text: `SELECT	*
            FROM	login_info
            WHERE	login_info.email = $1`,
      values: [signupDTO.email],
    }

    const checkUsernameQuery = {
      text: `SELECT	*
            FROM	login_info
            WHERE	login_info.username = $1`,
      values: [signupDTO.username],
    }


    const enterNewUser = {
      text: `WITH new_applicant AS (
                  INSERT INTO person(first_name, last_name, personal_number,role_id)
                  VALUES ($1, $2, $3, $4) RETURNING person.id
            )
            INSERT INTO login_info(email, password, username, person_id)
            VALUES ($5, $6, $7,
                  (SELECT new_applicant.id
                  FROM new_applicant)
                ) RETURNING login_info.username, login_info.person_id`,
      values: [signupDTO.firstName, signupDTO.lastName, signupDTO.personalNumber, 
              recruitmentRoles.Applicant, signupDTO.email, passwordHash, signupDTO.username],
    }
    
    let retValue;
    try {
      await this.client.query('BEGIN');

      const emailCheck = await this.client.query(checkEmailQuery);
      const usernameCheck = await this.client.query(checkUsernameQuery);

      if (emailCheck.rowCount > 0) {
        retValue = new UserDTO(signupDTO.username, recruitmentRoles.Invalid, userErrorCodes.ExistentEmail);
      }
      else if(usernameCheck.rowCount > 0) {
        retValue = new UserDTO(signupDTO.username, recruitmentRoles.Invalid, userErrorCodes.ExistentUsername);
      }
      else {
        await this.client.query(enterNewUser);
        retValue = new UserDTO(signupDTO.username, recruitmentRoles.Applicant, userErrorCodes.OK);
      }

      await this.client.query('COMMIT');
      return retValue;
    } catch (err) {
      await this.client.query('ROLLBACK');
      console.log("Signup Error\n", err.stack);
      return null;
    }
  }

  /**
   * Get all the jobs and their respective competences.
   * @returns {JobDTO} An array of an objects that hold the information about the jobs and 
   *                  competences.
   */
  async getJobs() {
    let jobID = 0;

    const getJobsQuery = {
      text:`SELECT		job.*
            FROM		job
            ORDER BY	job ASC`
    }

    try {
      await this.client.query('BEGIN');

      const jobRes = await this.client.query(getJobsQuery);

      let jobs = [];

      for(let i = 0; i < jobRes.rowCount; i++) {
        jobID = jobRes.rows[i].id;
        const getJobCompetencesQuery = {
          text:`SELECT		competence.id, competence.type
                FROM		competence
                WHERE   competence.job_id = $1
                ORDER BY	competence ASC`,
          values: [jobID]
        }
        const competences = await this.client.query(getJobCompetencesQuery);

        jobs[i] = new JobDTO(jobRes.rows[i].id, jobRes.rows[i].name ,competences.rows);
      }

      await this.client.query('COMMIT');
      return jobs;
    } catch (err) {
      await this.client.query('ROLLBACK');
      console.log("Jobs Error\n", err.stack);
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
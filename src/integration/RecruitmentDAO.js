'use strict';

const {Client} = require('pg');
const pbkdf2 = require('pbkdf2');
const UserDTO = require('../model/UserDTO');
const recruitmentRoles = require('../util/rolesEnum');
const userErrorCodes = require('../util/userErrCodes');
const JobDTO = require('../model/JobDTO');
const Logger = require('../util/Logger');
const RegistrationDTO = require('../model/RegistrationDTO');
const registrationErrEnum = require('../util/registrationErrEnum');
const ApplicationsListDTO = require('../model/ApplicationsListDTO');
const filterEmptyParamEnum = require('../util/filterEmptyParamEnum');
const ApplicationDTO = require('../model/ApplicationDTO');
const applicationErrorCodes = require('../util/applicationErrorCodes');
const DecisionDTO = require('../model/DecisionDTO');
const decisionsEnum = require('../util/decisionsEnum');
const decisionErrorCodes = require('../util/decisionErrorCodes');

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
            connectionTimeoutMillis: 5000,
            statement_timeout: 2000,
            query_timeout: 2000,
            ssl: {rejectUnauthorized: false},
        });

        this.logger = new Logger('DatabaseHandler');
        this.PAGELIMIT = 25;
    }

    /**
   * Establish the connection to the database with the credentials.
   * Has an event for handling unexpected disconnection to database.
   */
    async establishConnection() {
        try {
            this.client.on('error', (err) => {
                this.client._connecting = true;
                this.client._connected = false;
                this.client._connectionError = true;
                this.logger.logException(err);
            });
            await this.client.connect();
        } catch (err) {
            this.logger.logException(err);
        }
    }

    /**
   * Check whether the information of the login are correct.
   * @param {String} username The username of the profile.
   * @param {String} password The password related to the user.
   * @return {UserDTO | null} An object containing the username and the role of the user
   *                           The role ID is either 0 for Invalid, 1 for Recruiter,
   *                            2 for Applicant. Null in case something went wrong.
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
            const connection = await this._checkConnection();

            if (!connection) {
                return null;
            }

            await this._runQuery('BEGIN');

            const results = await this._runQuery(checkLoginQuery);

            let retValue;
            if (results.rowCount <= 0) {
                retValue = new UserDTO(username, recruitmentRoles.Invalid, userErrorCodes.LoginFailure);
            } else {
                retValue = new UserDTO(results.rows[0].username, results.rows[0].role_id, userErrorCodes.OK);
            }

            await this._runQuery('COMMIT');

            return retValue;
        } catch (err) {
            this.logger.logException(err);
            return null;
        }
    }

    /**
   * Take the new user information and make entries in the database if the user is new.
   * @param {SignupDTO} signupDTO The needed info about the new user.
   * @return {UserDTO | null} On object containing the username and the role of the user
   *                           The role ID is either 0 for Invalid, 1 for Recruiter,
   *                            2 for Applicant. Null in case something went wrong.
   */
    async signupUser(signupDTO) {
        const passwordHash = await this._generatePasswordHash(signupDTO.username, signupDTO.password);

        const checkEmailQuery = {
            text: `SELECT    *
            FROM    login_info
            WHERE    login_info.email = $1`,
            values: [signupDTO.email],
        };

        const checkUsernameQuery = {
            text: `SELECT    *
            FROM    login_info
            WHERE    login_info.username = $1`,
            values: [signupDTO.username],
        };


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
        };

        try {
            const connection = await this._checkConnection();

            if (!connection) {
                return null;
            }

            await this._runQuery('BEGIN');

            const emailCheck = await this._runQuery(checkEmailQuery);
            const usernameCheck = await this._runQuery(checkUsernameQuery);

            let retValue;

            if (emailCheck.rowCount > 0) {
                retValue = new UserDTO(signupDTO.username, recruitmentRoles.Invalid, userErrorCodes.ExistentEmail);
            } else if (usernameCheck.rowCount > 0) {
                retValue = new UserDTO(signupDTO.username, recruitmentRoles.Invalid, userErrorCodes.ExistentUsername);
            } else {
                await this._runQuery(enterNewUser);
                retValue = new UserDTO(signupDTO.username, recruitmentRoles.Applicant, userErrorCodes.OK);
            }

            await this._runQuery('COMMIT');

            return retValue;
        } catch (err) {
            this.logger.logException(err);
            return null;
        }
    }

    /**
   * Get all the jobs and their respective competences.
   * @return {JobDTO | null} An array of an objects that hold the information about the jobs and
   *                  competences. Null in case something went wrong.
   */
    async getJobs() {
        let jobID = 0;

        const getJobsQuery = {
            text: `SELECT        job.*
            FROM        job
            ORDER BY    job ASC`,
        };

        try {
            const connection = await this._checkConnection();

            if (!connection) {
                return null;
            }

            await this._runQuery('BEGIN');

            const jobRes = await this._runQuery(getJobsQuery);

            const jobs = [];

            for (let i = 0; i < jobRes.rowCount; i++) {
                jobID = jobRes.rows[i].id;
                const getJobCompetencesQuery = {
                    text: `SELECT        competence.id, competence.type
                FROM        competence
                WHERE   competence.job_id = $1
                ORDER BY    competence ASC`,
                    values: [jobID],
                };
                const competences = await this._runQuery(getJobCompetencesQuery);

                jobs[i] = new JobDTO(jobRes.rows[i].id, jobRes.rows[i].name, competences.rows);
            }

            await this._runQuery('COMMIT');

            return jobs;
        } catch (err) {
            this.logger.logException(err);
            return null;
        }
    }

    /**
   * Register a new application for the applicant.
   * @param {ApplicationInfoDTO} applicationInfoDTO An object that has all the info about the
   *                                                new application. Username, competence id,
   *                                                availability from and to periods.
   * @return {RegistrationDTO | null} An object with the id of the new registered application.
   *                                   any failure of registration will result in an error code
   *                                   indicating the reason, the error code are enumerated
   *                                   in registrationErrEnum.js. Null in case something went wrong.
   */
    async registerNewApplication(applicationInfoDTO) {
        try {
            const connection = await this._checkConnection();

            if (!connection) {
                return null;
            }
            await this._runQuery('BEGIN');
            let registrationConfirmation;
            let errorChecker = false;

            const personID = await this._getPersonID(applicationInfoDTO.username);

            if (personID === -1) {
                registrationConfirmation = new RegistrationDTO(0, registrationErrEnum.InvalidUsername);
                errorChecker = true;
            } else {
                const roleID = await this.getRoleID(personID);

                if (roleID === -1 || roleID === recruitmentRoles.Recruiter) {
                    registrationConfirmation = new RegistrationDTO(0, registrationErrEnum.InvalidRole);
                    errorChecker = true;
                }
            }

            if (!errorChecker) {
                const checkCompetenceQuery = {
                    text: `SELECT    competence.id AS competence_id
                FROM    competence
                WHERE    competence.id = $1`,
                    values: [applicationInfoDTO.competenceID],
                };

                const checkApplicationQuery = {
                    text: `SELECT    application.id AS application_id
                FROM    application
                      INNER JOIN applicant_availability ON 
                                  (applicant_availability.person_id = application.person_id)
                WHERE    application.person_id = $1 AND
                      application.competence_id = $2 AND
                      applicant_availability.from_date <= DATE($3) AND
                      applicant_availability.to_date >= DATE($4)`,
                    values: [personID, applicationInfoDTO.competenceID, applicationInfoDTO.dateFrom,
                        applicationInfoDTO.dateTo],
                };

                const checkApplicationRes = await this._runQuery(checkApplicationQuery);
                const checkCompetenceRes = await this._runQuery(checkCompetenceQuery);

                if (checkCompetenceRes.rowCount <= 0) {
                    registrationConfirmation = new RegistrationDTO(0, registrationErrEnum.InvalidCompetence);
                } else if (checkApplicationRes.rowCount > 0) {
                    registrationConfirmation = new RegistrationDTO(checkApplicationRes.rows[0].application_id,
                        registrationErrEnum.ExistentApplication);
                } else {
                    const registerNewApplicationQuery = {
                        text: `WITH new_application AS (
                    INSERT INTO public.application(years_of_experience, competence_id, person_id)
                    VALUES ($1, $2, $3) RETURNING application.id
                  )    INSERT INTO public.application_status(decision, recruiter_id, application_id)
                    VALUES ('Unhandled', null,
                      (SELECT    new_application.id
                      FROM    new_application
                      )
                    ) RETURNING application_status.application_id`,
                        values: [applicationInfoDTO.yearsOfExperience, applicationInfoDTO.competenceID,
                            personID],
                    };

                    const addApplicationAvailabilityQuery = {
                        text: `INSERT INTO public.applicant_availability(from_date, to_date, person_id)
                  VALUES ($1, $2, $3)`,
                        values: [applicationInfoDTO.dateFrom, applicationInfoDTO.dateTo, personID],
                    };

                    const registerNewApplicationRes = await this._runQuery(registerNewApplicationQuery);
                    await this._runQuery(addApplicationAvailabilityQuery);

                    registrationConfirmation = new RegistrationDTO(
                        registerNewApplicationRes.rows[0].application_id,
                        registrationErrEnum.OK);
                }
            }

            await this._runQuery('COMMIT');

            return registrationConfirmation;
        } catch (err) {
            this.logger.logException(err);
            return null;
        }
    }

    /**
   * Get the applications that are filtered with specific parameters.
   * @param {ApplicationFilterDTO} applicationFilterDTO An object holding the necessary information
   *                                                    about the filtering parameters that the
   *                                                    applications will fullfil.
   * @return {ApplicationsListDTO | null} An object with the filtered applications info.
   *                                       Null in case something went wrong.
   */
    async getApplicationsList(applicationFilterDTO) {
        const offset = await this._getOffset(applicationFilterDTO.page, this.PAGELIMIT);

        try {
            const applicationsRes = await this._getApplications(applicationFilterDTO);

            let retList;

            const applicationsList = [];

            for (let i = 0; i < applicationsRes.rowCount; i++) {
                applicationsList[i] = {
                    applicationID: applicationsRes.rows[i].application_id,
                    firstName: applicationsRes.rows[i].first_name,
                    lastName: applicationsRes.rows[i].last_name,
                };
            }

            retList = [...applicationsList];

            if (applicationFilterDTO.page > filterEmptyParamEnum.Page) {
                const limitApplicationsList = [];

                for (let i = 0; i < this.PAGELIMIT; i++) {
                    const offsetIndex = i + offset;

                    if (offsetIndex >= applicationsList.length) {
                        break;
                    }

                    limitApplicationsList[i] = applicationsList[offsetIndex];
                }

                retList = [...limitApplicationsList];
            }

            return new ApplicationsListDTO(retList);
        } catch (err) {
            this.logger.logException(err);
            return null;
        }
    }

    /**
   * Get the total number of the application that are filtered with the specific parameters.
   * @param {ApplicationFilterDTO} applicationFilterDTO An object holding the necessary information
   *                                                    about the filtering parameters that the
   *                                                    applications will fullfil.
   * @return {Integer | null} The total amount of the filtered applications.
   *                           Null in case something went wrong.
   */
    async getApplicationsCount(applicationFilterDTO) {
        try {
            const applicationsRes = await this._getApplications(applicationFilterDTO);
            return applicationsRes.rowCount;
        } catch (err) {
            this.logger.logException(err);
            return null;
        }
    }

    /**
   * Get how many pages are the filtered applications separated into.
   * @param {ApplicationFilterDTO} applicationFilterDTO An object holding the necessary information
   *                                                    about the filtering parameters that the
   *                                                    applications will fullfil.
   * @return {Integer | null} the total count of the pages. Null in case something went wrong.
   */
    async getPageCount(applicationFilterDTO) {
        try {
            const applicationsRes = await this._getApplications(applicationFilterDTO);
            const pageCount = Math.ceil(applicationsRes.rowCount / this.PAGELIMIT);
            return pageCount;
        } catch (err) {
            this.logger.logException(err);
            return null;
        }
    }

    /**
   * Get all the information related to the application desired.
   * @param {Integer} applicationID the id for the specific application.
   * @return {ApplicationDTO | null} An object holding all the related information for the
   *                                  desired application. Null in case something went wrong.
   */
    async getApplication(applicationID) {
        const getApplicationQuery = {
            text: `SELECT   application.id AS application_id, person.first_name, person.last_name,
                      competence.id AS competence_id, competence.type, application.years_of_experience,
                      applicant_availability.from_date, applicant_availability.to_date,
                      application_status.decision
            FROM      application
                      INNER JOIN person ON (application.person_id = person.id)
                      INNER JOIN competence ON (application.competence_id = competence.id)
                      INNER JOIN applicant_availability ON (applicant_availability.person_id = application.person_id)
                      INNER JOIN application_status ON (application_status.application_id = application.id)
            WHERE     application.id = $1
            ORDER BY  applicant_availability.to_date ASC`,
            values: [applicationID],
        };

        try {
            const connection = await this._checkConnection();

            if (!connection) {
                return null;
            }

            let retApplication;

            await this._runQuery('BEGIN');

            const applicationRes = await this._runQuery(getApplicationQuery);

            if (applicationRes.rowCount <= 0) {
                retApplication = new ApplicationDTO(applicationID, 'DUMMY', 'DUMMY',
                    {id: 999999, type: 'DUMMY'}, 0,
                    '1212-12-12', '1212-12-12', 'Unhandled',
                    applicationErrorCodes.InvalidID);
            } else {
                retApplication = new ApplicationDTO(applicationRes.rows[0].application_id,
                    applicationRes.rows[0].first_name,
                    applicationRes.rows[0].last_name,
                    {
                        id: applicationRes.rows[0].competence_id,
                        type: applicationRes.rows[0].type,
                    },
                    applicationRes.rows[0].years_of_experience,
                    applicationRes.rows[0].from_date.toISOString().slice(0, 10),
                    applicationRes.rows[0].to_date.toISOString().slice(0, 10),
                    applicationRes.rows[0].decision,
                    applicationErrorCodes.OK);
            }

            await this._runQuery('COMMIT');

            return retApplication;
        } catch (err) {
            this.logger.logException(err);
            return null;
        }
    }

    /**
   * Register the decision that was taken about an application. Keeping in mind that only recruiters
   * have the privilege to do that.
   * @param {String} username The username that is related to the recruiter.
   * @param {Integer} applicationID The id for the application that is decided upon.
   * @param {String} decision The decision taken about the application.
   * @return {DecisionDTO | null} An object holding the decision that was registered to the application.
   *                              Null in case something went wrong.
   */
    async submitApplicationDecision(username, applicationID, decision) {
        try {
            const connection = await this._checkConnection();

            if (!connection) {
                return null;
            }

            await this._runQuery('BEGIN');

            let retDecision;
            const personID = await this._getPersonID(username);
            const applicationChecker = await this._checkApplication(applicationID);

            if (personID === -1) {
                retDecision = new DecisionDTO(decisionsEnum.Unhandled, decisionErrorCodes.InvalidUsername);
            } else if (applicationChecker.applicationStatusID === -1) {
                retDecision = new DecisionDTO(decisionsEnum.Unhandled, decisionErrorCodes.InvalidApplication);
            } else if (applicationChecker.decision !== decisionsEnum.Unhandled) {
                retDecision = new DecisionDTO(applicationChecker.decision, decisionErrorCodes.ExistentDecision);
            } else if (decision !== decisionsEnum.Unhandled &&
                decision !== decisionsEnum.Accepted &&
                decision !== decisionsEnum.Rejected) {
                retDecision = new DecisionDTO(decisionsEnum.Unhandled, decisionErrorCodes.InvalidDecision);
            } else {
                const submitDecisionQuery = {
                    text: `UPDATE public.application_status
                SET     decision= $1, recruiter_id= $2
                WHERE   application_id = $3;`,
                    values: [decision, personID, applicationID],
                };

                await this._runQuery(submitDecisionQuery);

                retDecision = new DecisionDTO(decision, decisionErrorCodes.OK);
            }

            await this._runQuery('COMMIT');

            return retDecision;
        } catch (err) {
            this.logger.logException(err);
            return null;
        }
    }

    // eslint-disable-next-line require-jsdoc
    async _getRoleID(personID) {
        const getRoleIDQuery = {
            text: `SELECT   person.role_id
                    FROM    person
                    WHERE   person.id = $1`,
            values: [personID],
        };

        try {
            let roleID = -1;

            await this._runQuery('BEGIN');

            const roleIDRes = await this._runQuery(getRoleIDQuery);

            if (roleIDRes.rowCount > 0) {
                roleID = roleIDRes.rows[0].role_id;
            }

            await this._runQuery('COMMIT');

            return roleID;
        } catch (err) {
            throw err;
        }
    }

    // eslint-disable-next-line require-jsdoc
    async _checkApplication(applicationID) {
        const checkApplicationQuery = {
            text: `SELECT   application_status.id,
                            application_status.decision
                FROM        application_status
                WHERE       application_status.application_id = $1`,
            values: [applicationID],
        };

        try {
            const connection = await this._checkConnection();

            if (!connection) {
                return null;
            }

            let applicationExistent = {applicationStatusID: -1, decision: decisionsEnum.Unhandled};

            await this._runQuery('BEGIN');

            const checkApplicationRes = await this._runQuery(checkApplicationQuery);

            if (checkApplicationRes.rowCount > 0) {
                applicationExistent = {
                    applicationStatusID: checkApplicationRes.rows[0].id,
                    decision: checkApplicationRes.rows[0].decision,
                };
            }

            await this._runQuery('COMMIT');

            return applicationExistent;
        } catch (err) {
            throw err;
        }
    }

    // eslint-disable-next-line require-jsdoc
    async _getApplications(applicationFilterDTO) {
        let name = applicationFilterDTO.name;
        let competenceID = applicationFilterDTO.competenceID;
        let dateFrom = applicationFilterDTO.dateFrom;
        let dateTo = applicationFilterDTO.dateTo;

        if (name === filterEmptyParamEnum.Name) {
            name = '';
        }
        if (competenceID === filterEmptyParamEnum.CompetenceID) {
            competenceID = -1;
        }
        if (dateFrom === filterEmptyParamEnum.Date) {
            dateFrom = '';
        }
        if (dateTo === filterEmptyParamEnum.Date) {
            dateTo = '';
        }

        const getApplicationsQuery = {
            text: `SELECT   application.id AS application_id,
                      person.first_name, person.last_name
                      
            FROM      person
                      INNER JOIN application ON (application.person_id = person.id)
                      INNER JOIN applicant_availability ON (applicant_availability.person_id = person.id)
            WHERE     CASE WHEN (($1 = '') IS NOT TRUE) THEN
                        (person.first_name = $1 OR
                        person.last_name = $1)
                      ELSE
                        TRUE
                      END
                      AND
                      CASE WHEN (($2 = -1) IS NOT TRUE) THEN
                        application.competence_id = $2
                      ELSE
                        TRUE
                      END
                      AND
                      CASE WHEN (($3 = '') IS NOT TRUE) THEN
                        applicant_availability.from_date >= DATE($3)
                      ELSE
                        TRUE
                      END
                      AND
                      CASE WHEN (($4 = '') IS NOT TRUE) THEN
                        applicant_availability.to_date <= DATE($4)
                      ELSE
                        TRUE
                      END
                      AND role_id = 2
            ORDER BY  application.id ASC`,
            values: [name, competenceID, dateFrom, dateTo],
        };

        try {
            const connection = await this._checkConnection();

            if (!connection) {
                return null;
            }

            await this._runQuery('BEGIN');

            const applicationsRes = await this._runQuery(getApplicationsQuery);

            await this._runQuery('COMMIT');

            return applicationsRes;
        } catch (err) {
            throw err;
        }
    }

    // eslint-disable-next-line require-jsdoc
    async _getOffset(page, limit) {
        return (page - 1) * limit;
    }

    // eslint-disable-next-line require-jsdoc
    async _getPersonID(username) {
        const getPersonIDQuery = {
            text: `   SELECT  login_info.person_id
                FROM    login_info
                WHERE   username = $1`,
            values: [username],
        };

        try {
            const connection = await this._checkConnection();

            if (!connection) {
                return null;
            }

            await this._runQuery('BEGIN');

            const personIDRes = await this._runQuery(getPersonIDQuery);

            let personID = -1;

            if (personIDRes.rowCount > 0) {
                personID = personIDRes.rows[0].person_id;
            }

            await this._runQuery('COMMIT');

            return personID;
        } catch (err) {
            throw err;
        }
    }

    // eslint-disable-next-line require-jsdoc
    async _runQuery(query) {
        try {
            const results = await this.client.query(query);
            return results;
        } catch (err) {
            const connection = await this._checkConnection();

            if (connection) {
                await this.client.query('ROLLBACK');
            }

            throw err;
        }
    }

    // eslint-disable-next-line require-jsdoc
    async _checkConnection() {
        try {
            return this.client._connected;
        } catch (err) {
            throw err;
        }
    }

    // eslint-disable-next-line require-jsdoc
    async _generatePasswordHash(username, password) {
        const globalSalt = process.env.GLOBAL_SALT;
        const userSalt = globalSalt.concat('_', username);
        const derivedKeyBuffer = pbkdf2.pbkdf2Sync(password, userSalt, 25, 32, 'sha512');
        const hexBuffer = Buffer.from(derivedKeyBuffer, 'utf8');
        return hexBuffer.toString('hex');
    }

    // eslint-disable-next-line require-jsdoc
    async _signupRecruiter(signupDTO) {
        const passwordHash = await this._generatePasswordHash(signupDTO.username, signupDTO.password);

        const checkEmailQuery = {
            text: `SELECT    *
            FROM    login_info
            WHERE    login_info.email = $1`,
            values: [signupDTO.email],
        };

        const checkUsernameQuery = {
            text: `SELECT    *
            FROM    login_info
            WHERE    login_info.username = $1`,
            values: [signupDTO.username],
        };


        const enterNewUser = {
            text: `WITH new_recruiter AS (
                  INSERT INTO person(first_name, last_name, personal_number,role_id)
                  VALUES ($1, $2, $3, $4) RETURNING person.id
            )
            INSERT INTO login_info(email, password, username, person_id)
            VALUES ($5, $6, $7,
                  (SELECT new_recruiter.id
                  FROM new_recruiter)
                ) RETURNING login_info.username, login_info.person_id`,
            values: [signupDTO.firstName, signupDTO.lastName, signupDTO.personalNumber,
                recruitmentRoles.Recruiter, signupDTO.email, passwordHash, signupDTO.username],
        };

        try {
            const connection = await this._checkConnection();

            if (!connection) {
                return null;
            }

            await this._runQuery('BEGIN');

            const emailCheck = await this._runQuery(checkEmailQuery);
            const usernameCheck = await this._runQuery(checkUsernameQuery);

            let retValue;

            if (emailCheck.rowCount > 0) {
                retValue = new UserDTO(signupDTO.username, recruitmentRoles.Invalid, userErrorCodes.ExistentEmail);
            } else if (usernameCheck.rowCount > 0) {
                retValue = new UserDTO(signupDTO.username, recruitmentRoles.Invalid, userErrorCodes.ExistentUsername);
            } else {
                await this._runQuery(enterNewUser);
                retValue = new UserDTO(signupDTO.username, recruitmentRoles.Recruiter, userErrorCodes.OK);
            }

            await this._runQuery('COMMIT');

            return retValue;
        } catch (err) {
            this.logger.logException(err);
            return null;
        }
    }
}

module.exports = RecruitmentDAO;

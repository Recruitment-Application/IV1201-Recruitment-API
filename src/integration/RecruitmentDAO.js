'use strict';

const { Client } = require('pg')
const pbkdf2 = require('pbkdf2')
const UserDTO = require('../model/UserDTO');

class RecruitmentDAO {

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

  async establishConnection() {
    try {
      await this.client.connect();
    } catch (err) {
      console.log(err.stack);
    }
  }

  async signinUser(username, password) {
    const passwordHash = await this._generatePasswordHash(username, password);
    const query = {
      text: `SELECT login_info.username, person.role_id
            FROM    login_info
                    INNER JOIN person ON (login_info.person_id = person.id)
            WHERE   login_info.username = $1 AND
                    login_info.password = $2`,
      values: [username, passwordHash],
    };

    try {
      const results = await this.client.query(query);

      if (results.rowCount <= 0) {
        return null;
      }
      else {
        return new UserDTO(results.rows[0].username, results.rows[0].role_id);
      }
    } catch (err) {
      console.log(err.stack);
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
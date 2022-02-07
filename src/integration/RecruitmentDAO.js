'use strict';

const UserDTO = require('./UserDTO');
const { Client } = require('pg')


class RecruitmentDAO {

  constructor() {
    this.client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'recruitmentsdb',
        password: 'postgres',
        port: 5432,
    });
  }
 
  async establishConnection() {
    try {
      await this.client.connect();
    } catch(err) {
      console.log(err.stack);
    }
  }

  async signinUser(username, password) {
    const query = {
      text: `SELECT login_info.username, person.role_id
            FROM    login_info
                    INNER JOIN person ON (login_info.person_id = person.id)
            WHERE   login_info.username = $1 AND
                    login_info.password = $2`,
      values: [username, password],
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
}

module.exports = RecruitmentDAO;
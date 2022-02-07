'use strict';

const RecruitmentDAO = require('../integration/RecruitmentDAO');

class Controller {

    constructor() {
        this.recruitmentDAO = new RecruitmentDAO();
    }

    static async createController() {
        const controller = new Controller();
        await controller.recruitmentDAO.establishConnection();
        return controller;
    }

    async loginUser(username, password) {
        const userDTO = await this.recruitmentDAO.signinUser(username, password);
        return userDTO;
    }

}

module.exports = Controller;

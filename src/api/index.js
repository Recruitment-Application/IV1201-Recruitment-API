'use strict';

const UserApi = require('./UserApi');


class RequestHandlerLoader {
  constructor() {
    this.reqHandlers = [];
    this.errorHandlers = [];
  }

  addRequestHandler(reqHandler) {
    this.reqHandlers.push(reqHandler);
  }


  loadHandlers(app) {
    console.log("loading handlers");
    this.reqHandlers.forEach((reqHandler) => {
      reqHandler.registerHandler();
      app.use(reqHandler.path, reqHandler.router);
    });
  }


}

const reqHandlerloader = new RequestHandlerLoader();

reqHandlerloader.addRequestHandler(new UserApi());

module.exports = reqHandlerloader;


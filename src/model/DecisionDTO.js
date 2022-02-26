'use strict';

const Validators = require('../util/Validators');

/**
 * Represents the response of updating the decision on an application.
 */
class DecisionDTO {
    /**
   * Create an instance of the decision made on the application.
   * @param {String} decision The decision that is taken regarding the application.
   * @param {Integer} errorCode The code represent the state of the result.
   *                            It is either Unhandled, Accepted or Rejected.
   */
    constructor(decision, errorCode) {
        Validators.isDecision(decision, 'Decision');
        this.decision = decision;
        this.errorCode = errorCode;
    }
}

module.exports = DecisionDTO;

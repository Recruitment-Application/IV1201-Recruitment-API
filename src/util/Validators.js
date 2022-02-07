'use strict';

const assert = require('assert').strict;
const validator = require('validator');

class Validators {

    static isIntegerBetween(value, lowerLimit, upperLimit, varName)
    {
        let result = validator.isInt(value.toString(), { min: lowerLimit, max: upperLimit });

        assert(
            result,
            `${varName} is not an integer between ${lowerLimit} and ${upperLimit}.`
        );

    }

    static isAlphanumericString(value, varName) {
        let result = validator.isAlphanumeric(value);
        assert(
            result,
            `${varName} must consist of letters and numbers only.`
        );
      }
}

module.exports = Validators;
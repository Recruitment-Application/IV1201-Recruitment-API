'use strict';

const assert = require('assert').strict;
const validator = require('validator');
const personnummer = require("swedish-personal-identity-number-validator");

/**
 * A class with validation methods. This class contains validation methods
 * that are specifically tailored to suit the needs of other classes
 * in the project.
 */
class Validators {

    /**
     * Checks that the provided value is an integer that bigger or equal to lowerLimit,
     * and is smaller or equal to upperLimit.
     * 
     * @param {any} value The value to be validated.
     * @param {number} lowerLimit The lower allowed limit, inclusive.
     * @param {number} upperLimit The upper allowed limit, inclusive.
     * @param {string} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isIntegerBetween(value, lowerLimit, upperLimit, varName) {
        let result = validator.isInt(value.toString(), { min: lowerLimit, max: upperLimit });

        assert(
            result,
            `${varName} is not an integer between ${lowerLimit} and ${upperLimit}.`
        );

    }

    /**
     * Checks that the specified value is an alphanumeric string.
     * 
     * @param {any} value The value to be validated.
     * @param {string} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isAlphanumericString(value, varName) {
        let result = validator.isAlphanumeric(value.toString());
        assert(
            result,
            `${varName} must consist of letters and numbers only.`
        );
    }

    /**
     * Checks if the specified values only consists of letters no more.
     * @param {any} value The value to be validated.
     * @param {String} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isAlphaString(value, varName) {
        let result = validator.isAlpha(value.toString());
        assert(
            result,
            `${varName} must consist of letters.`
        );
    }

    /**
     * Checks if the email is formatted correctly, valid email example (xx.xx@xx.xx.xx).
     * @param {any} value The value to be validated.
     * @param {String} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isEmailFormat(value, varName) {
        let result = validator.isEmail(value.toString());
        assert(
            result,
            `${varName} should be formatted correctly, example (xx.xx@xx.xx.xx).`
        );
    }

    /**
     * Checks if the personal number for the person is formatted correctly, 
     * valid personal number example (YYYYMMDD-XXXX), 13 characters to be specific.
     * The personal number will be also checked if it is valid.
     * @param {any} value The value to be validated.
     * @param {String} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isPersonalNumberFormat(value, varName) {
        let result = this.isPersonalNumber(value);
        result = personnummer.isValid(value.toString());
        assert(
            result,
            `${varName} should be formatted correctly, example (YYYYMMDD-XXXX).`
        );
    }

    /**
     * Checks if the personal number for the person is formatted correctly, 
     * valid personal number example (YYYYMMDD-XXXX), 13 characters to be specific.
     * The personal number will be also checked if it is valid.
     * @param {any} value The value to be validated.
     * @returns {boolean} indicates whether the personal number is valid or not.
     */
    static isPersonalNumber(value) {
        let result = validator.matches(value.toString(),
            '^[0-9]{8}-[0-9]{4}$');
        if (result === true) {
            result = personnummer.isValid(value.toString());
        }

        return result;
    }
}

module.exports = Validators;
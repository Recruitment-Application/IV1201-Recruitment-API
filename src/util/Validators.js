'use strict';

const assert = require('assert').strict;
const validator = require('validator');
const personnummer = require('swedish-personal-identity-number-validator');

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
        const result = validator.isInt(value.toString(), {min: lowerLimit, max: upperLimit});

        assert(
            result,
            `${varName} is not an integer between ${lowerLimit} and ${upperLimit}.`,
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
        const result = validator.isAlphanumeric(value.toString());
        assert(
            result,
            `${varName} must consist of letters and numbers only.`,
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
        const result = validator.isAlpha(value.toString(), ['sv-SE'], {ignore: '\''});
        assert(
            result,
            `${varName} must consist of letters.`,
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
        const result = validator.isEmail(value.toString());
        assert(
            result,
            `${varName} should be formatted correctly, example (xx.xx@xx.xx.xx).`,
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
        const result = this.isPersonalNumber(value);
        assert(
            result,
            `${varName} should be formatted correctly, example (YYYYMMDD-XXXX).`,
        );
    }

    /**
     * Checks if the personal number for the person is formatted correctly,
     * valid personal number example (YYYYMMDD-XXXX), 13 characters to be specific.
     * The personal number will be also checked if it is valid.
     * @param {any} value The value to be validated.
     * @return {boolean} indicates whether the personal number is valid or not.
     */
    static isPersonalNumber(value) {
        let result = validator.matches(value.toString(),
            '^[0-9]{8}-[0-9]{4}$');
        if (result === true) {
            result = personnummer.isValid(value.toString());
        }

        return result;
    }

    /**
     * Check if the value is a number that is whole no decimals, and is bigger than zero (positive number).
     * @param {any} value The value to be validated.
     * @param {String} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isPositiveWholeNumber(value, varName) {
        const result = validator.isInt(value.toString(), {min: 1});
        assert(
            result,
            `${varName} should be a positive whole number.`,
        );
    }

    /**
     * Check if the description is actually a text with only spaces present.
     * @param {any} value The value to be validated.
     * @param {String} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isDescriptionString(value, varName) {
        const result = validator.isAlpha(value.toString(), ['sv-SE'], {ignore: ' '});
        assert(
            result,
            `${varName} must consist of letters that could be separated by spaces.`,
        );
    }

    /**
     * Check if the value is a valid competence, competence is an object {id, type}
     * @param {any} value The value to be validated.
     * @param {String} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isCompetence(value, varName) {
        let result = validator.isInt(value.id.toString(), {min: 1});

        assert(
            result,
            `${varName} ID should be a positive whole number.`,
        );

        result = validator.isAlpha(value.type.toString(), ['sv-SE'], {ignore: ' '});

        assert(
            result,
            `${varName} type should consist of letters that could be separated by spaces.`,
        );
    }

    /**
     * Checks if the Date is formatted correctly, valid date example (YYYY-MM-DD).
     * The date will be also validated if it is actual.
     * @param {any} value The value to be validated.
     * @param {String} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isDateFormat(value, varName) {
        const result = validator.isDate(value.toString(), {format: 'YYYY-MM-DD', strictMode: true,
            delimiters: ['-']});
        assert(
            result,
            `${varName} should be formatted correctly, example (YYYY-MM-DD).`,
        );
    }

    /**
     * Check if the value is a non negative number that could be a zero.
     * @param {any} value The value to be validated.
     * @param {String} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isNonNegativeNumber(value, varName) {
        let result = false;

        if (value >= 0) {
            result = true;
        }

        assert(
            result,
            `${varName} should be a non negative number.`,
        );
    }

    /**
     * Check if the value is not negative, zero in considered as a positive number.
     * @param {any} value The value to be validated.
     * @param {String} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isNonNegativeWholeNumber(value, varName) {
        const result = validator.isInt(value.toString(), {min: 0});

        assert(
            result,
            `${varName} number should be a non-negative whole number.`,
        );
    }

    /**
     * Check if the value is an application object {applicationID, firstName, lastName}.
     * @param {any} value The value to be validated.
     * @param {String} varName The variable name to be included in the assertion error message
     *                         in case that the validation fails.
     * @throws {AssertionError} If validation fails.
     */
    static isApplication(value, varName) {
        let result = validator.isInt(value.applicationID.toString(), {min: 1});

        assert(
            result,
            `${varName} ID should be a positive whole number bigger than zero.`,
        );

        result = validator.isAlpha(value.firstName.toString(), ['sv-SE'], {ignore: '\''});

        assert(
            result,
            `${varName} first name should consist only of letters.`,
        );

        result = validator.isAlpha(value.lastName.toString(), ['sv-SE'], {ignore: '\''});

        assert(
            result,
            `${varName} last name should consist only of letters.`,
        );
    }
}

module.exports = Validators;

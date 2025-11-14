/**
 * @module Regex
 * 
 * This module defines the pattern constants of the application.
 */
import ApiError from "../exceptions/api.error.js";
const Regex = Object.freeze({
  /** Constants **/
  patterns: {
    TITLE: /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/,
    NAME: /^[A-Za-z]+(?: [A-Za-z]+)*$/,
    TIME: /^([01]\d|2[0-3]):[0-5]\d$/,
    IDENTIFIER: /^[A-Za-z0-9]+$/,
    SLUG: /^[A-Za-z]+(?:-[A-Za-z0-9]+)*$/,
    CODE: /^[0-9]{4}$/,
    AADHAAR_OTP: /^[0-9]{6}$/,
    BANKNO: /^\d{9,18}$/,
    IFSC: /^[A-Z]{4}[0-9]{1}[A-Z0-9]{6}$/,
    AADHAR: /^\d{12}$/,
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/
  },

  /** Helper Methods **/
  getRegex(patternName) {
    if (!Object.prototype.hasOwnProperty.call(this.patterns, patternName)) {
      throw new ApiError({ message: "Unknown pattern name provided.", errors: { patternName }, forClient: false });
    }
    return this.patterns[patternName];
  },

  getRegexPatterns() {
    return this.patterns;
  },


});

export default Regex;
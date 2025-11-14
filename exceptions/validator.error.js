/**
 * @module ValidatorError
 * 
 * This module serves as a custom error class to generate validation errors for clients
 */

import BaseError from "./base.error.js";


class ValidatorError extends BaseError {
  constructor({ errors = {}, code = "UNPROCESSABLE_ENTITY" }) {
    const message = "Invalid inputs. Verify and correct the provided data.";
    super(message);
    this.code = code;
    this.errors = errors;
    this.forClient = true;
    this.hasReported = true;
  }
}

export default ValidatorError;
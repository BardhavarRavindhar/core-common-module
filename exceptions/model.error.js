/**
 * @module ApiError
 * 
 * This module serves as a custom error class to generate api errors
 */

import BaseError from "./base.error.js";


class ModelError extends BaseError {
  constructor({ message, code = "TYPE_ERROR", errors = null, forClient = true, hasReported = true }) {
    super(message, code, errors, forClient);
    this.hasReported = hasReported;
  }
}

export default ModelError;
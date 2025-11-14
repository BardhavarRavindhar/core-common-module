/**
 * @module BaseError
 * 
 * This module serves as a custom error class for API-related errors
 * It extends the native Error class and enforces direct instantiation of BaseError to enforce subclassing.
 */

class BaseError extends Error {
  constructor(message, code, errors = null, forClient = false) {
    if (new.target === BaseError) {
      throw new TypeError("Cannot instantiate BaseError directly");
    }
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.errors = errors;
    this.forClient = forClient;
    this.hasReported = false;
    this.type = "api";
    Error.captureStackTrace(this, this.constructor);
  }
}

export default BaseError;
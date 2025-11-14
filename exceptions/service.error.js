/**
 * @module ServiceError
 * 
 * This module serves as a custom error class to generate third-party services related errors
 */

import BaseError from "./base.error.js";


class ServiceError extends BaseError {
  constructor({ serviceName, message, code, errors = null, forClient = true, hasReported = true }) {
    super(message, code, errors, forClient);
    this.serviceName = serviceName;
    this.hasReported = hasReported;
  }
}

export default ServiceError;
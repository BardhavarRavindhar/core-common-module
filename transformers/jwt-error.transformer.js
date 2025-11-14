/**
 * @module transformJwtError
 * 
 * Handle JWT errors gracefully for better response.
 */

import ServiceError from "../exceptions/service.error.js";

/**
 * Map Twilio error codes to custom error codes.
 * @type {object}
 */
const jwtErrorMap = {
  TokenExpiredError: { message: "Unauthorized identity. Please login again.", code: "EXPIRED_TOKEN" },
  JsonWebTokenError: { message: "Unauthorized identity. Please login again.", code: "INVALID_TOKEN" }
};

/**
 * Transform JWT error to custom error.
 * @param {object} error - The error object thrown by JWT.
 * @returns {ServiceError} - The transformed error object if useful error found
 */
const transformJwtError = (error) => {
  if (error.name !== undefined && jwtErrorMap[error.name]) {
    const jwtError = jwtErrorMap[error.name];
    jwtError.serviceName = "Jwt";
    error = new ServiceError(jwtError);
  }
  return error;
}

export default transformJwtError;
/**
 * @module HttpCore
 * 
 * This module defines the http code's constants that provide status codes for the API.
 */

import ApiError from "../exceptions/api.error.js";

/**
 * Enum for HTTP status codes
 * @readonly
 * @enum {number}
 */
export const HttpCodes = Object.freeze({
  // 2xx Codes
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 4xx Codes
  AUTH_PROCESS_ERROR: 400,
  BAD_REQUEST: 400,
  COOLDOWN_ACTIVE: 400,
  INVALID_PHONE_NUMBER: 400,
  INVALID_OTP: 400,
  MAX_SELECTION_REACHED: 400,
  MINIMUM_RECORD_REQUIRED: 400,
  MISSING_AUTH_HEADERS: 400,
  MISSING_TOKEN: 400,
  NO_FILE_PROVIDED: 400,
  MALFORMED_AUTH_TOKEN: 400,
  OTP_ATTEMPTS_EXCEEDED: 400,
  INVALID_MEDIA_TYPE: 400,
  OTP_EXPIRED: 410,
  INVALID_IDENTITY: 401,

  EXTERNAL_AUTH_ERROR: 401,
  EXPIRED_REFRESH_TOKEN: 401,
  EXPIRED_TOKEN: 401,
  REVOKED_REFRESH_TOKEN: 401,
  INVALID_CREDENTIALS: 401,
  INVALID_TOKEN: 401,
  OTP_MISMATCH: 401,
  REVOKED_TOKEN: 401,
  UNAUTHORIZED: 401,
  USER_NOT_FOUND: 401,

  ACCOUNT_FORBIDDEN: 403,
  FORBIDDEN: 403,
  OTP_FORBIDDEN: 403,
  ROLE_FORBIDDEN: 403,
  INSUFFICIENT_PERMISSIONS: 403,
  SESSION_LIMIT_EXCEEDED: 403,

  NOT_FOUND: 404, //Route not found
  RESOURCE_NOT_FOUND: 404,

  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  REQUEST_TIMEOUT: 408,
  LENGTH_REQUIRED: 408,

  CONFLICT: 409,
  DUPLICATE_FIELD: 409,
  RESOURCE_ALREADY_EXISTS: 409,

  FILE_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_FILE_TYPE: 415,

  UNPROCESSABLE_ENTITY: 422,
  RESOURCE_LOCKED: 423,
  RATE_LIMIT_EXCEEDED: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  PAYMENT_INSUFFICIENT: 402,

  // 5xx Server Error
  INTERNAL_SERVER_ERROR: 500,
  FILE_UPLOAD_ERROR: 500,
  TYPE_ERROR: 500,
  NOT_IMPLEMENTED: 510,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
});

/**
 * @method getHttpStatusCode
 * Helper function to get the message corresponding to an HTTP status code
 * @param {string} code - The HTTP error code provided by system
 * @returns {number} - The corresponding HTTP status code
 */
export const getHttpStatusCode = (code) => {
  if (!Object.prototype.hasOwnProperty.call(HttpCodes, code)) {
    throw new ApiError({ message: "Unknown HTTP code provided.", errors: { code }, forClient: false });
  }
  return HttpCodes[code];
};

/**
 * @method getHttpAllowedMethods
 * Helper function to get the allowed HTTP methods
 * @param {string} code - The HTTP error code provided by system
 * @returns {string[]} - The list of allowed HTTP methods
 */
export const getHttpAllowedMethods = () => {
  const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  return allowedMethods;
};
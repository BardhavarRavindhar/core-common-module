/**
 * @module transformTwilioError
 * 
 * Handle Twilio errors gracefully for better response.
 */

import ServiceError from "../exceptions/service.error.js";

/**
 * Map Twilio error codes to custom error codes.
 * @type {object}
 */
const twilioErrorMap = {
  21211: {
    message: "Invalid phone number provided.",
    code: "INVALID_PHONE_NUMBER"
  }
};

/**
 * Transform Twilio error to custom error.
 * @param {object} error - The error object thrown by Twilio.
 * @returns {ServiceError} - The transformed error object if useful error found
 */
const transformTwilioError = (error) => {
  if (error.code !== undefined && Number.isInteger(error.code) && twilioErrorMap[error.code]) {
    const twilioError = twilioErrorMap[error.code];
    twilioError.serviceName = "Twilio";
    error = new ServiceError(twilioError);
  }
  return error;
}

export default transformTwilioError;
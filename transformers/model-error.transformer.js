/**
 * @module transformModelError
 * 
 * Handle database errors gracefully for better response.
 */

import ModelError from "../exceptions/model.error.js";

/**
 * Transform Twilio error to custom error.
 * @param {object} error - The error object thrown by Twilio.
 * @returns {ServiceError} - The transformed error object if useful error found
 */
const transformModelError = (error) => {
  const errors = {};

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    for (const field in error.errors) {
      errors[field] = error.errors[field].message;
    }
  }

  // Handle unique constraint errors
  if (error.code && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    errors[field] = `${field} already taken. Try with another value.`;
  }

  // Handle collation errors (if any)
  if (error.name === 'MongoError' && error.code === 16755) {
    const field = error.message.match(/index: (.+?)_/)[1];
    errors[field] = 'No duplicate value allowed.';
  }

  // If errors were found, convert to ValidationError
  if (Object.keys(errors).length > 0) {
    error = new ModelError({ message: "Please review your error before try again.", code: "BAD_REQUEST", errors: errors, forClient: true });
  }
  return error;
}

export default transformModelError;
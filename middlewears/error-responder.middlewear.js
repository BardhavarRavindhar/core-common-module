/**
 * @module errorResponder Middleware
 *
 * Centralized error-handling middleware for sending uniform error responses.
 * Logs the error and sends a standardized error response using res.sendError.
 */
import logger from "../utils/logger.util.js";
import ApiError from "../exceptions/api.error.js";

const errorResponder = async (error, req, res, next) => {
  logger.error(error);
  // If the error is not intended for the client, replace it with a generic error.
  if (error.forClient === undefined || error.forClient !== true) {
    error = new ApiError({
      message: "Unknown API error. Please try again!!",
      code: "INTERNAL_SERVER_ERROR"
    });
  }
  return res.sendError({
    message: error.message,
    code: error.code,
    errors: error.errors,
  });
};

export default errorResponder;
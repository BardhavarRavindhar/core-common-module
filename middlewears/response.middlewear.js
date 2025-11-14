/** 
  * @module apiResponse Middlewear
  *
  * This module provides middleware functions for handling API responses.
  * It includes functions to send success and error responses in a consistent format.
  */
import { getHttpStatusCode } from "../enums/httpcore.enum.js";

/**
 * Middleware to handle API responses
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
const apiResponse = (req, res, next) => {
  /**
   * Send a success response
   * @param {string} message - The success message
   * @param {string} [code="OK"] - The HTTP status code
   * @param {Object|null} [data=null] - The response data
   * @returns {Object} - The response object
   */
  res.sendSuccess = ({ message, code = "OK", data = null }) => {
    const status = getHttpStatusCode(code);
    const response = {
      success: true,
      code: code,
      message,
    };
    if (data !== null) {
      response.data = data;
    }
    return res.status(status).json(response);
  };

  /**
   * Send a collection response for list data with pagination, sorting and other metadata
   * @param {string} message - The success message
   * @param {string} [code="OK"] - The HTTP status code
   * @param {Object} [collection] - hold keys having data and metadata for response
   * @param {Array} [collection.data] - provide resource data list
   * @param {Object} [collection.metadata={}] - provide response metadata related searching, sorting and pagination
   * @returns {Object} - The response object
   */
  res.sendCollection = ({ message, code = "OK", collection = {} }) => {
    const status = getHttpStatusCode(code);
    const response = {
      success: true,
      code: code,
      message,
      metadata: collection.metadata || {},
      data: collection.data || [],
    };
    return res.status(status).json(response);
  };

  /**
   * Send an error response
   * @param {string} message - The error message
   * @param {string} [code="INTERNAL_SERVER_ERROR"] - The HTTP status code
   * @param {Object|null} [errors=null] - The error details
   * @returns {Object} - The response object
   */
  res.sendError = ({ message, code = "INTERNAL_SERVER_ERROR", errors = null }) => {
    const status = getHttpStatusCode(code);
    const response = {
      success: false,
      code: code,
      message,
    };
    if (errors !== null) {
      response.errors = errors;
    }
    return res.status(status).json(response);
  };

  next();
};

export default apiResponse;

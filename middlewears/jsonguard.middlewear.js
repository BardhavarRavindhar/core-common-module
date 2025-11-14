/** 
  * @module jsonGuard Middlewear
  *
  * Middlewear to validate request json payload
  */
import ApiError from '../exceptions/api.error.js';

/**
 * Custom verification function for JSON parsing.
 * Throws an ApiError if the JSON payload is invalid.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Buffer} buf - The raw request body buffer.
 * @param {string} encoding - The encoding of the buffer.
 */
const jsonGuard = (req, res, buf, encoding) => {
  try {
    JSON.parse(buf);
  } catch (err) {
    throw new ApiError({ message: "Invalid JSON payload provided.", code: "BAD_REQUEST" });
  }
};

export default jsonGuard;

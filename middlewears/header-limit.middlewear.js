/**
 * @module headerLimit Middleware
 *
 * Middleware to enforce a maximum length for individual HTTP header fields.
 * If any header field exceeds the specified limit, it responds with a 431 error.
 */
import ApiError from "../exceptions/api.error.js";
import catchAsync from "../utils/catch-async.util.js";

const headerLimit = ({ size = 1024 }) => {
  return catchAsync(async (req, res, next) => {
    for (const [name, value] of Object.entries(req.headers)) {
      // Check Header name
      if (typeof value === "string" && value.length > size) {
        throw new (new ApiError({ message: `Header "${name}" is too large.`, code: "REQUEST_HEADER_FIELDS_TOO_LARGE" }));
      }
      // Check Header value
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item.length > size) {
            throw new ApiError({ message: `Header "${name}" contains a value that is too large.`, code: "REQUEST_HEADER_FIELDS_TOO_LARGE" });
          }
        }
      }
    }
    next();
  });
}

export default headerLimit;
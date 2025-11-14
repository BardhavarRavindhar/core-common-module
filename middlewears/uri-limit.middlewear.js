/**
 * @module uriLmit Middleware
 *
 * Catch-all middleware for routes that do not match any registered route.
 * Passes a "Not Found" ApiError to the next middleware.
 */
import ApiError from "../exceptions/api.error.js";
import catchAsync from "../utils/catch-async.util.js";

const uriLmit = ({ size = 1024 }) => {
  return catchAsync(async (req, res, next) => {
    if (req.url.length > size) {
      throw new ApiError({ message: "The requested URI is too long.", code: "URI_TOO_LONG" });
    }
    next();
  });
}

export default uriLmit;
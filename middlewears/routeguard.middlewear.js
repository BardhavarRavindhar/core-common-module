/**
 * @module routeGuard Middleware
 *
 * Catch-all middleware for routes that do not match any registered route.
 * Passes a "Not Found" ApiError to the next middleware.
 */
import ApiError from "../exceptions/api.error.js";
import catchAsync from "../utils/catch-async.util.js";

const routeGuard = catchAsync(async (req, res, next) => {
  throw new ApiError({ message: "Not Found", code: "NOT_FOUND" });
});

export default routeGuard;
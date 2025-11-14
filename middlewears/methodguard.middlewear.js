/** 
  * @module methodGuard Middleware
  * 
  * This middleware checks if the HTTP method of the incoming request is allowed.
  * If the method is not allowed, it responds with a 405 Method Not Allowed error.
  */
import ApiError from '../exceptions/api.error.js';
import { getHttpAllowedMethods } from "../enums/httpcore.enum.js";
import catchAsync from "../utils/catch-async.util.js";

const methodGuard = catchAsync(async (req, res, next) => {
  const allowedMethods = getHttpAllowedMethods();
  if (!allowedMethods.includes(req.method)) {
    throw new ApiError({ message: "Method not supported", code: "METHOD_NOT_ALLOWED" });
  }
  next();
});

export default methodGuard;

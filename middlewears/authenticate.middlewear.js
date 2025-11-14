/**
 * @module Authenticate Middleware
 *
 * Middleware to validate JWT tokens, verify user accounts, and set auth user properties.
 */
import ApiError from "../exceptions/api.error.js";
import JwtService from "../providers/jwt.provider.js";
import { getAuthProfile, validSessionDevice } from "../actions/user.action.js";
import catchAsync from "../utils/catch-async.util.js";

const Authenticate = ({ forSystem = false, forExpert = false } = {}) => {
  return catchAsync(async (req, res, next) => {
    // @case1: Check for Authentication Bearer Header
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError({ message: "Authentication token not provided.", code: "MISSING_TOKEN" });
    }

    // @case2: Validate Bearer Token by JWT
    const authToken = authHeader.split(" ")[1];
    const JWT = new JwtService();
    const data = await JWT.validateAccessToken(authToken);

    if (!data || !data.identity || !data.device) {
      throw new ApiError({ message: "Invalid authentication token.", code: "INVALID_TOKEN" });
    }

    // @case3: Check User Account exists and has valid access
    const Account = await getAuthProfile(data.identity);
    if (!Account) {
      throw new ApiError({ message: "Unauthenticated Access. No account found with provided data.", code: "INVALID_IDENTITY" });
    }

    // Validate account scope (e.g., system vs. client access)
    if (Account.forSystem !== forSystem) {
      const errorMessage = forSystem
        ? "Access restricted. Please switch to an administrator account to proceed."
        : "Access restricted. Please switch to a user account to proceed.";
      throw new ApiError({ message: errorMessage, code: "ACCOUNT_FORBIDDEN" });
    }


    // @case4: Check ifdevice revoked or not
    const loggedDevice = await validSessionDevice(data.identity, data.device);
    if (!loggedDevice) {
      throw new ApiError({ message: "Unauthenticated Access. No device found with provided data.", code: "INVALID_IDENTITY" });
    }
    // @case5: Check if the token has been revoked
    if (forExpert) {
      if (!Account.expertEnrolledAt) {
        throw new ApiError({ message: "Expert enrollment is mandatory to unlock the full features of expert to access.", code: "ACCOUNT_FORBIDDEN" });
      }
    }

    req.auth = {
      identity: Account._id.toString(),
      role: Account.roleName,
      forSystem: Account.forSystem,
      username: Account.username,
      email: Account.email,
      phone: Account.phone,
      type: Account.type
    };

    next();
  });
};

export default Authenticate;

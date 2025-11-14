/**
 * @module RefreshTokenGuard Middleware
 *
 * Middleware to validate JWT refresh token
 */
import ApiError from "../exceptions/api.error.js";
import JwtService from "../providers/jwt.provider.js";
import catchAsync from "../utils/catch-async.util.js";
import { getProvideRefreshTokenSession } from "../actions/auth.action.js";
import { getAuthProfile } from "../actions/user.action.js";

const RefreshTokenGuard = ({ forSystem = false } = {}) => {
  return catchAsync(async (req, res, next) => {
    /**  @case1 : Check for Authentication Bearer Header **/
    let authID = req.headers["x-auth-identity"];
    let authToken = req.headers["x-auth-refresh-token"];

    if (!authToken || !authID) {
      throw new ApiError({ message: "Missing required headers for refresh token.", code: "MISSING_AUTH_HEADERS" });
    } else {
      authID = authID.trim();
      authToken = authToken.trim();
    }

    /**  @case2 : Validate Refresh Token **/
    const JWT = new JwtService();
    const tokenPayload = await JWT.validateRefreshToken(authToken);
    const { identity } = tokenPayload;
    if (identity !== authID) {
      throw new ApiError({ message: " The refresh token provided is unacceptable. Unable to renew your session. Please log in again.", code: "MALFORMED_AUTH_TOKEN" });
    }
    /**  @case3 : Check user identify with token **/
    const deviceSession = await getProvideRefreshTokenSession(identity, authToken);
    if (!deviceSession) {
      throw new ApiError({ message: "Refresh token is revoked. Please log in again.", code: "REVOKED_REFRESH_TOKEN" });
    }
    const { platform, device } = deviceSession;
    // @case3: Check User Account exists and has valid access
    const Account = await getAuthProfile(identity);
    if (!Account) {
      throw new ApiError({ message: "Unauthenticated Access. No account found with provided data.", code: "INVALID_IDENTITY" });
    }
    req.auth = {
      identity: identity,
      device: device,
      platform: platform,
      forSystem: forSystem,
      type: Account.type
    }

    next();
  });
};

export default RefreshTokenGuard;

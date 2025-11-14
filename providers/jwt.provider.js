/**
 * @module JwtService
 * 
 * Provides methods to handle token-based authentication, including signing, verifying,
 * decoding, and validity checks for Access and Refresh Tokens.
 */

import JwtProvider from "jsonwebtoken";
import CONFIG from "../configs/api.config.js";
import transformJwtError from "../transformers/jwt-error.transformer.js";
import { getEpocTime } from "../utils/timer.util.js";
import { generateUniqueCode } from "../utils/codegen.util.js";

const { PLATFORM_NAME, JWT } = CONFIG;

class JwtService {
  constructor() {
    // Define the algorithm used for signing tokens
    this.algorithm = "HS256";
    // Set the token issuer from the platform name configuration
    this.issuer = PLATFORM_NAME;
    // Load secrets and expiration times for access and refresh tokens from config
    this.accessSecret = JWT.ACCESS_SECRET;
    this.refreshSecret = JWT.REFRESH_SECRET;
    this.accessExpires = JWT.ACCESS_EXP;
    this.refreshExpires = JWT.REFRESH_EXP;

    // Generate the issued-at timestamp and a unique token identity once per instance
    // so both tokens share the same metadata when needed.
    this.issuedAt = getEpocTime();
    this.tokenIdentity = generateUniqueCode(21);
  }

  /**
   * Signs an access token with the given payload.
   * @param {Object} payload - The payload to sign.
   * @returns {string} - The signed access token.
   */
  signAccessToken(payload) {
    this.issuedAt = getEpocTime();
    this.tokenIdentity = generateUniqueCode(21);
    const tokenPayload = {
      ...payload,
      iat: this.issuedAt,
      jti: this.tokenIdentity,
    };

    const options = {
      algorithm: this.algorithm,
      issuer: this.issuer,
      expiresIn: this.accessExpires,
      noTimestamp: false, // Force unique timestamps
    };

    const accessToken = JwtProvider.sign(tokenPayload, this.accessSecret, options);
    return accessToken;
  }

  /**
   * Signs a refresh token with the given payload.
   * @param {Object} payload - The payload to sign.
   * @returns {string} - The signed refresh token.
   */
  signRefreshToken(payload) {
    const tokenPayload = {
      ...payload,
      iat: this.issuedAt,
      jti: this.tokenIdentity,
      noTimestamp: false, // Force unique timestamps
    };

    const options = {
      algorithm: this.algorithm,
      issuer: this.issuer,
      expiresIn: this.refreshExpires,
    };

    const refreshToken = JwtProvider.sign(tokenPayload, this.refreshSecret, options);
    return refreshToken;
  }

  /**
   * Validates an access token.
   * @param {string} accessToken - The access token to validate.
   * @returns {Object} - The decoded token payload.
   * @throws {Error} - If the token is invalid.
   */
  validateAccessToken(accessToken) {
    try {
      return JwtProvider.verify(accessToken, this.accessSecret, {
        issuer: this.issuer,
      });
    } catch (error) {
      // Transform and throw the error for consistent error handling
      throw transformJwtError(error);
    }
  }

  /**
   * Validates a refresh token.
   * @param {string} refreshToken - The refresh token to validate.
   * @returns {Object} - The decoded token payload.
   * @throws {Error} - If the token is invalid.
   */
  validateRefreshToken(refreshToken) {
    try {
      return JwtProvider.verify(refreshToken, this.refreshSecret, {
        issuer: this.issuer,
      });
    } catch (error) {
      // Transform and throw the error for consistent error handling
      throw transformJwtError(error);
    }
  }

  /**
   * Rotates the JWT secrets securely.
   * This method should be called at regular intervals to update the signing keys.
   * Implementation might involve:
   * - Generating new secrets.
   * - Storing the new secrets in a secure storage (e.g., Redis or database).
   * - Maintaining a window for old tokens to remain valid until expiration.
   */
  rotateSecret() {
    // Implement secret rotation logic here.
  }
}

export default JwtService;

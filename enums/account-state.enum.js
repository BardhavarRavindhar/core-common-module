/**
 * @module AccountState
 * 
 * This module defines account status constants and provides helper methods 
 * to manage and retrieve user account statuses.
 */

import ApiError from "../exceptions/api.error.js";

/**
 * Enum-like object containing account status codes and their descriptions.
 * @constant {Object} StateCodes
 */
export const StateCodes = Object.freeze({
  PENDING: "Your account is pending verification. Please complete the verification process to activate your account.",
  ACTIVE: "Your account is active and available to use.",
  INACTIVE: "Your account is currently inactive. Please contact support for more information.",
  SUSPENDED: "Your account has been suspended due to a policy violation. Please contact support for further assistance.",
  BANNED: "Your account has been permanently banned. Please contact support if you believe this is an error.",
  DELETED: "Your account is marked for deletion, and the process is currently underway."
});

/**
 * @method getAccountStates
 * Retrieves all available account status codes.
 * @returns {string[]} Array of state code keys.
 */
export const getAccountStates = () => Object.keys(StateCodes);

/**
 * @method getAccountStateMeta
 * Retrieves metadata for a given account status code.
 * @param {string} code - The account status code.
 * @returns {Object} An object containing the status code and its description.
 * @throws {ApiError} If the provided status code is not recognized.
 */
export const getAccountStateMeta = (code) => {
  if (!Object.hasOwn(StateCodes, code)) {
    throw new ApiError({
      message: "Unknown account state code provided.",
      errors: { state: code },
      forClient: false
    });
  }
  return {
    status: code,
    statusNote: StateCodes[code]
  };
};

/**
 * Enum-like object containing kyc state codes and their descriptions.
 * @constant {Object} KycStates
 */
export const KycStates = Object.freeze({
  VERIFIED: "Your account’s KYC is verified. Enjoy seamless access to our services.",
  NOT_VERIFIED: "Your account’s KYC is pending. Update your information to unlock full account capabilities."
});

/**
 * @method getKycStates
 * Retrieves all available kyc states.
 * @returns {string[]} Array of state keys.
 */
export const getKycStates = () => Object.keys(KycStates);

/**
 * @method getKycStates
 * Retrieves metadata for a given kyc state.
 * @param {string} state - The  kyc state.
 * @returns {Object} An object containing the state and its description.
 * @throws {ApiError} If the provided state is not recognized.
 */
export const getKycStateMeta = (state) => {
  if (!Object.hasOwn(KycStates, state)) {
    throw new ApiError({
      message: "Unknown account kyc state code provided.",
      errors: { kycState: state },
      forClient: false
    });
  }
  return {
    state: state,
    stateNote: KycStates[state]
  };
};
/**
 * @module UserAction
 * 
 * This module defines the actions related to user and its bio.
 */
import UserModel from "../models/user.model.js";
import SessionModel from "../models/session.model.js";
import config from "../configs/api.config.js";
import { generateQR } from "../utils/codegen.util.js";

const { DOMAINS } = config;

/**
 * @method getAccountProfile
 * Retrieves the account profile of a user based on the given contact information.
 * Determines the search field based on the mode flag.
 *
 * @param {string} contact - The contact information (phone number or email address) of the user.
 * @param {boolean} [mode=true] - Search mode; if true, search by phone; if false, search by email.
 * @returns {Promise<Object|null>} - A promise that resolves to the user account object if found, or null otherwise.
 */
export const getAccountProfile = async (contact, mode = true) => {
  let account;
  if (mode) {
    //By Phone
    account = await UserModel.findOne({ phone: contact }).exec();
  } else {
    account = await UserModel.findOne({ email: contact }).exec();
  }
  return account;
}// end fn {getAccountProfile}

/**
 * @method getAuthProfile
 * Retrieves the authenticated user's profile using their unique identifier.
 *
 * @param {string} identity - The unique ID of the user.
 * @returns {Promise<Object|null>} - A promise that resolves to the user profile object if found, or null otherwise.
 */
export const getAuthProfile = async (identity) => {
  return await UserModel.findById(identity).exec();
}// end fn {getAuthProfile}

/**
 * @method getProfileQR
 * Generates a QR code for the user's profile URL.
 *
 * @param {string} username - The username used to generate the profile URL.
 * @returns {Promise<string>} - A promise that resolves to a QR code string representing the user's profile URL.
 */
export const getProfileQR = async (username) => {
  const profile = `${DOMAINS.PLATFORM_WEB}/profiles/${username}`;
  const QR = await generateQR(profile);
  return QR;
}// end fn {getProfileQR}

export const validSessionDevice = async (owner, device) => {
  const loggedDevice = SessionModel.findOne({ user: owner, device: device });
  return loggedDevice;
}
const UserAction = {
  getAuthProfile,
  getProfileQR,
  getAccountProfile,
  validSessionDevice
}
export default UserAction;
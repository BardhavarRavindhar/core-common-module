/**
 * @module ProfileAction
 *
 * This module defines actions to manage user profile data.
 */
import UserModel from "../models/user.model.js";
import ProfileModel from "../models/profile.model.js";
import LanguageModel from "../models/language.model.js";
import ApiError from "../exceptions/api.error.js";
import ValidatorError from "../exceptions/validator.error.js";
import PlatformAction from "../actions/platform.action.js";
import { getCurrentUTC } from "../utils/timer.util.js";
import MediaService from "../providers/media.provider.js";
import { calculateProfileProgress } from "../utils/profile-progress.util.js";
/**
 * @method manageProfile
 * Updates both the account and profile data of a user.
 *
 * @param {string} identity - The user ID.
 * @param {object} payload - The new profile details.
 */
const manageProfile = async (identity, payload) => {
  await PlatformAction.validateLanguageCodes(payload.languages);
  const accountData = {
    displayName: payload.displayName,
    location: payload.location,
    languages: payload.languages,
    provinceCode: payload.provinceCode,
    countryCode: payload.countryCode,
    photo: payload.photo,
  };

  const profileData = {
    name: payload.name,
    gender: payload.gender,
    city: payload.city,
    dateOfBirth: payload.dateOfBirth,
  };

  const province = await PlatformAction.getProvinceByCode(
    accountData.provinceCode
  );
  if (!province) {
    throw new ApiError({
      message: "Invalid state code provided.",
      code: "BAD_REQUEST",
      errors: { provinceCode: accountData.provinceCode },
    });
  }
  if (accountData.languages.length > LanguageModel.limit) {
    throw new ValidatorError({
      errors: { languages: accountData.provinceCode },
    });
  }
  /** @info : Start Transaction  */
  const trxQuery = await UserModel.initTransactionSession();
  await trxQuery.startTransaction();

  try {
    const account = await UserModel.findByIdAndUpdate(identity, accountData, {
      session: trxQuery,
      new: true,
    }).populate("profile");

    // Calculate progress score with updated data
    const progressScore = calculateProfileProgress(account.profile, account);

    // Update profile with progress score
    const profile = await ProfileModel.findByIdAndUpdate(
      account.profile._id,
      {
        ...profileData,
        profileProgressScore: progressScore,
        isCompleted: progressScore === 100,
      },
      { session: trxQuery, new: true }
    );

    account.profile = profile;
    await trxQuery.commitTransaction();
    return account;
  } catch (error) {
    await trxQuery.abortTransaction();
    throw error;
  } finally {
    await trxQuery.endSession();
  }
};

/**
 * @method manageLanguageProfile
 * Updates the languages set in a user's profile.
 *
 * @param {string} identity - The user ID.
 * @param {Array<string>} codes - An array of language codes.
 */
const manageLanguageProfile = async (identity, codes) => {
  await PlatformAction.validateLanguageCodes(codes);
  const account = await UserModel.findByIdAndUpdate(
    identity,
    { languages: codes },
    { new: true }
  ).exec();
  return account;
};

/**
 * @method manageSocialPlatforms
 * Updates the social platform settings for a user.
 * @param {string} identity - The user ID.
 * @param {Object} socials - An object where keys are social platform codes and values are details.
 */
const manageSocialPlatforms = async (identity, socials) => {
  const codes = Object.keys(socials);
  const socialHandlers = [];
  await PlatformAction.validateSocialCodes(codes);
  for (const [platform, profileUrl] of Object.entries(socials)) {
    socialHandlers.push({ social: platform, profileUrl: profileUrl });
  }
  const account = await UserModel.findByIdAndUpdate(
    identity,
    { socials: socialHandlers },
    { new: true }
  )
    .populate({
      path: "socials.social",
      select: "name icon", // Populate only necessary fields
    })
    .exec();
  return account;
};

/**
 * @method updateAboutMe
 * Updates the About Me section for a user's profile.
 * @param {string} identity - The user ID.
 * @param {string} about - The new "about me" content.
 */
const updateAboutMe = async (identity, about) => {
  const account = await ProfileModel.findOneAndUpdate(
    { user: identity },
    { about: about },
    { new: true }
  )
    .select("+about")
    .exec();
  return account;
};

/**
 * @method assignProfileTag
 * Assigns a tag to a user's profile.
 * @param {string} identity - The user ID.
 * @param {string} tag - The tag to be assigned to the user profile.
 */
const assignProfileTag = async (identity, tag) => {
  const account = await ProfileModel.findOneAndUpdate(
    { user: identity },
    { profileTag: tag },
    { new: true }
  )
    .select("+about")
    .exec();
  return account;
};

/**
 * @method updateUsername
 * Updates the username for a user.
 * @param {string} identity - The user ID.
 * @param {string} username - The new username.
 */
const updateUsername = async (identity, username) => {
  const account = await UserModel.findByIdAndUpdate(identity, {
    username: username,
  }).exec();
  return account;
};

/**
 * @method checkAccountEmail
 * Checks if an email is already in use by another account.
 * @param {string} identity - The user ID.
 * @param {string} email - The email to check.
 */
const checkAccountEmail = async (identity, email) => {
  return await UserModel.findOne({
    email: email,
    _id: { $ne: identity },
  }).exec();
};

/**
 * @method updateAccountEmail
 * Updates the email address for a user.
 * @param {string} identity - The user ID.
 * @param {string} email - The new email address.
 */
const updateAccountEmail = async (identity, email) => {
  const currentutc = getCurrentUTC();
  const account = await UserModel.findByIdAndUpdate(identity, {
    email: email,
    emailVerifiedAt: currentutc,
  }).exec();
  return account;
};

/**
 * @method checkAccountPhone
 * Checks if a phone number is already in use by another account.
 * @param {string} identity - The user ID.
 * @param {string} phone - The phone number to check.
 */
const checkAccountPhone = async (identity, phone) => {
  return await UserModel.findOne({
    phone: phone,
    _id: { $ne: identity },
  }).exec();
};

/**
 * @method updateAccountPhone
 * Updates the phone number for a user.
 * @param {string} identity - The user ID.
 * @param {string} phone - The new phone number.
 */
const updateAccountPhone = async (identity, phone) => {
  const currentutc = getCurrentUTC();
  const account = await UserModel.findByIdAndUpdate(identity, {
    phone: phone,
    phoneVerifiedAt: currentutc,
  }).exec();
  return account;
};

/**
 * @method setProfilePhoto
 * Sets the profile photo for a user.
 * @param {string} owner - The user ID.
 * @param {object} photo - The photo object.
 */
const setProfilePhoto = async (owner, photo) => {
  await MediaService.validateMediaFile(owner, photo, "IMAGE");
  return await UserModel.findByIdAndUpdate(owner, { photo: photo }).exec();
};

/**
 * @method deleteProfilePhoto
 * Deletes the profile photo for a user.
 * @param {string} owner - The user ID.
 */
const deleteProfilePhoto = async (owner) => {
  return await UserModel.findByIdAndUpdate(owner, { photo: null }).exec();
};

const ProfileAction = {
  manageProfile,
  setProfilePhoto,
  deleteProfilePhoto,
  assignProfileTag,
  manageLanguageProfile,
  manageSocialPlatforms,
  updateAboutMe,
  updateUsername,
  checkAccountPhone,
  updateAccountPhone,
  checkAccountEmail,
  updateAccountEmail,
};
export default ProfileAction;

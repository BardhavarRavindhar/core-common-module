/**
 * @module PassionAction
 * @alias Interest
 * This module defines methods to handle Passion related actions
 */

import PassionModel from "../models/passion.model.js";
import UserModel from "../models/user.model.js";
import PlatformAction from "../actions/platform.action.js";
import ModelError from "../exceptions/model.error.js";

/**
 * @method manageInterestProfile
 * Add or Update interests
 * @param {string} identity - The user's ID.
 * @param {Object} payload - The interests data.
 */
const manageInterestProfile = async (identity, payload) => {
  let profile;
  const { interests } = payload;
  if (interests.length > PassionModel.limit) {
    throw new ModelError({ message: `Once your interest profile is created, you may add up to  ${PassionModel.limit} records.`, code: "MAX_SELECTION_REACHED" });

  }
  // Validate the interest IDs
  await PlatformAction.validateInterestIds(interests);
  profile = await PassionModel.findOne({ user: identity }).exec();
  if (!profile) {
    // Start a transaction session
    const trxQuery = await UserModel.initTransactionSession();
    await trxQuery.startTransaction();

    try {
      console.log("create");
      // Create a new profile if none exists.
      const modelData = { user: identity, interests: [] };
      const [createdProfile] = await PassionModel.create([modelData], { session: trxQuery });

      // Generate document ID
      const docNo = PassionModel.provideDocID(createdProfile, false);

      // Update User profile reference
      await UserModel.findByIdAndUpdate(identity, { profileInterest: docNo }, {
        session: trxQuery,
        new: true,
      });

      // Commit transaction
      await trxQuery.commitTransaction();

      profile = createdProfile;
    } catch (error) {
      await trxQuery.abortTransaction(); // Rollback on error
      throw error;
    } finally {
      await trxQuery.endSession(); // Release session resources
    }
  }
  // Update existing profile
  profile.interests = interests;
  profile = await profile.save();

  return { interests: profile.interests };
}

/**
 * Get all interests for the given user.
 * @param {string} identity - The user's ID.
 * @returns {Array} Array of interest subdocuments.
 */
const getInterestProfile = async (identity) => {
  const profile = await PassionModel.findOne({ user: identity }).exec();
  if (!profile) {
    throw new ModelError({ message: "Interest profile not found.", code: "RESOURCE_NOT_FOUND" });
  }
  return { interests: profile.interests };
}

const PassionAction = {
  manageInterestProfile,
  getInterestProfile
}
export default PassionAction;

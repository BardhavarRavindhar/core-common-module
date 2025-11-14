/**
 * @module ProficiencyAction
 * @alias Expertise
 * This module defines methods to handle Proficiency related actions
 */

import ProficiencyModel from "../models/proficiency.model.js";
import UserModel from "../models/user.model.js";
import PlatformAction from "../actions/platform.action.js";
import ModelError from "../exceptions/model.error.js";
import logger from "../utils/logger.util.js";

/**
 * @method manageExpertiseProfile
 * Add or Update expertises
 * @param {string} identity - The user's ID.
 * @param {Object} payload - The expertises data.
 */
const manageExpertiseProfile = async (identity, payload) => {
  let profile;
  const { expertises } = payload;
  // logger.info(`expertise `, expertises.length)
  if (expertises.length > ProficiencyModel.limit) {
    throw new ModelError({
      message: `Once your expertise profile is created, you may add up to  ${ProficiencyModel.limit} records.`,
      code: "MAX_SELECTION_REACHED",
    });
  }

  // Validate the expertise IDs
  await PlatformAction.validateExpertiseIds(expertises);

  // Find the existing profile
  profile = await ProficiencyModel.findOne({ user: identity }).exec();

  // Create profile if it doesn't exist
  if (!profile) {
    // Start a transaction session
    const trxQuery = await UserModel.initTransactionSession();
    await trxQuery.startTransaction();

    try {
      // Create a new profile
      const modelData = { user: identity, expertises: [] };
      const [createdProfile] = await ProficiencyModel.create([modelData], {
        session: trxQuery,
      });

      // Generate document ID
      const docNo = ProficiencyModel.provideDocID(createdProfile, false);

      // Update User profile reference
      await UserModel.findByIdAndUpdate(
        identity,
        { profileExpertise: docNo },
        {
          session: trxQuery,
          new: true,
        }
      );

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

  // Create new expertises array from payload
  const newExpertises = expertises.map((exp) => {
    // Handle if exp is a string (just the ID)
    const expertiseId =
      typeof exp === "string" ? exp : exp.expertise?.toString();

    // Create the proper expertise object structure
    return {
      expertise: expertiseId,
      level: null,
      score: 0,
    };
  });

  // Replace existing expertises with new ones
  profile.expertises = newExpertises;

  // Save the updated profile
  profile = await profile.save();

  return { expertises: profile.expertises };
};

/**
 * Get all expertises for the given user.
 * @param {string} identity - The user's ID.
 * @returns {Array} Array of expertise subdocuments.
 */
const getExpertiseProfile = async (identity) => {
  const profile = await ProficiencyModel.findOne({ user: identity }).exec();
  if (!profile) {
    throw new ModelError({
      message: "Expertise profile not found.",
      code: "RESOURCE_NOT_FOUND",
    });
  }
  return { expertises: profile.expertises };
};

const ProficiencyAction = {
  manageExpertiseProfile,
  getExpertiseProfile,
};
export default ProficiencyAction;

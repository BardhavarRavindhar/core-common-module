/**
 * @module AchievementAction
 * 
 * This module defines methods to handle Achievement-related actions.
 */

import AchievementModel from "../models/achievement.model.js";
import UserModel from "../models/user.model.js";
import ModelError from "../exceptions/model.error.js";


/**
 * Add or Update Achievements for the given user.
 * @param {string} identity - The user's ID.
 * @param {Object} payload - The achievement data.
 * @returns {Object} The added achievement.
 */
const manageAchievement = async (identity, achievements) => {

  let profile = await AchievementModel.findOne({ user: identity });

  if (!profile) {
    const trxQuery = await UserModel.initTransactionSession();
    await trxQuery.startTransaction();
    try {
      const modelData = { user: identity, achievements: [] };
      const [newProfile] = await AchievementModel.create([modelData], { session: trxQuery });
      profile = newProfile;
      const docNo = AchievementModel.provideDocID(newProfile, false);

      await UserModel.findByIdAndUpdate(identity, { profileAchievement: docNo }, {
        session: trxQuery,
        new: true,
      });

      await trxQuery.commitTransaction();
    } catch (error) {
      await trxQuery.abortTransaction();
      throw error;
    } finally {
      await trxQuery.endSession();
    }
  }

  profile.achievements = achievements;
  profile = await profile.save();
  return { achievements: profile.achievements };
};

/**
 * Get all achievements for the given user.
 * @param {string} identity - The user's ID.
 * @returns {Object} The achievement profile.
 */
const getAchievements = async (identity) => {
  const profile = await AchievementModel.findOne({ user: identity }).exec();
  if (!profile) {
    throw new ModelError({ message: "Achievement profile not found.", code: "RESOURCE_NOT_FOUND" });
  }
  return { achievements: profile.achievements };
};

// Exporting actions
const AchievementAction = {
  manageAchievement,
  getAchievements
};

export default AchievementAction;

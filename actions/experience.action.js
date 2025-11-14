/**
 * @module ExperienceAction
 * 
 * This module defines methods to handle Experience related actions
 */

import ExperienceModel from "../models/experience.model.js";
import UserModel from "../models/user.model.js";
import ModelError from "../exceptions/model.error.js";
import { provideCastDate } from "../utils/timer.util.js";

/**
 * Adds a new experience for a given identity.
 * If no document exists for the identity, creates one.
 * @param {string} identity - The user's identity (ObjectId).
 * @param {Object} payload - Experience payload (title, organization, etc.)
 * @returns {Promise<Object>} The newly added experience entry.
 */
const createExperience = async (identity, payload) => {
  // Generate a custom recordNo if not provided.
  if (!payload.recordNo) {
    payload.recordNo = ExperienceModel.provideObjectID();
  }
  payload.startDate = provideCastDate(payload.startDate);

  // Find the user's achievement profile.
  let profile = await ExperienceModel.findOne({ user: identity });

  if (!profile) {
    // Start a transaction session
    const trxQuery = await UserModel.initTransactionSession();
    await trxQuery.startTransaction();
    try {
      // Create a new profile if none exists.
      const modelData = { user: identity, experiences: [] };
      const [newProfile] = await ExperienceModel.create([modelData], { session: trxQuery });
      profile = newProfile;
      const docNo = ExperienceModel.provideDocID(newProfile, false);
      await UserModel.findByIdAndUpdate(identity, { profileExperience: docNo }, {
        session: trxQuery,
        new: true
      });
      // Save all data
      await trxQuery.commitTransaction();
    } catch (error) {
      // Rollback on error if abort set to true
      await trxQuery.abortTransaction();
      throw error;
    } finally {
      await trxQuery.endSession(); // Release session resources
    }
  }
  payload.endDate = payload.activeEmployee ? null : provideCastDate(payload.endDate);
  profile.experiences.push(payload);
  profile = await profile.save();

  return { experiences: profile.experiences };
};

/**
 * Retrieves all experiences for a given identity.
 * @param {string} identity - The user's identity (ObjectId).
 * @returns {Promise<Array>} An array of experience entries.
 */
const getExperiences = async (identity) => {
  const profile = await ExperienceModel.findOne({ user: identity }).exec();
  if (!profile) {
    throw new ModelError({ message: "Experience profile not found.", code: "RESOURCE_NOT_FOUND" });
  }
  return { experiences: profile.experiences };
};


/**
 * Updates an experience entry for a given identity identified by recordNo.
 * @param {string} identity - The user's identity (ObjectId).
 * @param {string} recordNo - The record number of the experience.
 * @param {Object} updateData - The fields to update.
 * @returns {Promise<Object>} The result of the update operation.
 */
const updateExperience = async (identity, recordNo, updateData) => {
  const profile = await ExperienceModel.findOne({ user: identity }).exec();
  updateData.startDate = provideCastDate(updateData.startDate);
  if (!profile) {
    throw new ModelError({ message: "Experience profile not found.", code: "RESOURCE_NOT_FOUND" });
  }
  // Check if the record exists before updating
  const recordExists = profile.experiences.some((ach) => ach.recordNo === recordNo);
  if (!recordExists) {
    throw new ModelError({ message: "No matching experience found.", code: "RESOURCE_NOT_FOUND" });
  }
  const result = await ExperienceModel.findOneAndUpdate(
    { user: identity, "experiences.recordNo": recordNo },
    {
      $set: {
        "experiences.$.title": updateData.title,
        "experiences.$.organization": updateData.organization,
        "experiences.$.activeEmployee": updateData.activeEmployee,
        "experiences.$.certificate": updateData.certificate,
        "experiences.$.startDate": updateData.startDate,
        "experiences.$.endDate": updateData.activeEmployee ? null : provideCastDate(updateData.endDate)
      }
    },
    {
      new: true,
      projection: { experiences: { $elemMatch: { recordNo: recordNo } } }
    }
  );
  return { experiences: result.experiences };
};

/**
 * Deletes an experience entry for a user based on recordNo.
 * @param {string} identity - The user's identity (ObjectId).
 * @param {string} recordNo - The record number of the experience.
 * @returns {Promise<Object>} The result of the delete operation.
 */
const deleteExperience = async (identity, recordNo) => {
  const profile = await ExperienceModel.findOne({ user: identity }).exec();
  if (!profile) {
    throw new ModelError({ message: "Experience profile not found.", code: "RESOURCE_NOT_FOUND" });
  }
  // Check if the record exists before updating
  const recordExists = profile.experiences.some((ach) => ach.recordNo === recordNo);
  if (!recordExists) {
    throw new ModelError({ message: "No matching experience found.", code: "RESOURCE_NOT_FOUND" });
  }
  // Prevent deleting the last achievement (Profile must retain at least one)
  if (profile.experiences.length === 1) {
    throw new ModelError({
      message: "You must keep at least one experiences in your profile.",
      code: "MINIMUM_RECORD_REQUIRED"
    });
  }
  const result = await ExperienceModel.updateOne(
    { user: identity },
    { $pull: { experiences: { recordNo } } },
    { new: true }
  );
  return result;
};

const ExperienceAction = {
  createExperience,
  getExperiences,
  updateExperience,
  deleteExperience,
};

export default ExperienceAction;
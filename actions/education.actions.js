/**
 * @module EducationAction
 * 
 * This module defines methods to handle Education related actions using arrow functions.
 */

import EducationModel from "../models/education.model.js";
import UserModel from "../models/user.model.js";
import ModelError from "../exceptions/model.error.js";
import ValidatorError from "../exceptions/validator.error.js";
import { provideCastDate } from "../utils/timer.util.js";

const createEducation = async (identity, data) => {
  const isDuplicate = await EducationModel.isEducationDuplicate(identity, data);
  if (isDuplicate) {
    throw new ValidatorError({
      errors: {
        "institution": "This Institute and Degree combination is already in use.",
        "degree": "This Institute and Degree combination is already in use."
      }
    });
  }
  // Generate a recordNo if not provided.
  if (!data.recordNo) {
    // Use provided helper or fallback to uuid
    data.recordNo = EducationModel.provideObjectID();
  }
  data.startDate = provideCastDate(data.startDate);
  data.endDate = provideCastDate(data.endDate);
  // Find the Education document for the given identity.
  let profile = await EducationModel.findOne({ user: identity });
  if (!profile) {
    // Start a transaction session
    const trxQuery = await UserModel.initTransactionSession();
    await trxQuery.startTransaction();
    try {
      // Create a new profile if none exists.
      const modelData = { user: identity, educations: [] };
      const [newProfile] = await EducationModel.create([modelData], { session: trxQuery });
      profile = newProfile;
      const docNo = EducationModel.provideDocID(newProfile, false);
      await UserModel.findByIdAndUpdate(identity, { profileEducation: docNo }, {
        session: trxQuery,
        new: true,
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
  profile.educations.push(data);
  profile = await profile.save();

  return { educations: profile.educations };
};

const getEducations = async (identity) => {
  const profile = await EducationModel.findOne({ user: identity })
    .sort({ "educations.startDate": -1 }) // Let MongoDB handle the sorting
    .exec();
    
  if (!profile) {
    throw new ModelError({ message: "Education profile not found.", code: "RESOURCE_NOT_FOUND" });
  }
  
  return { educations: profile.educations };
};

const updateEducation = async (identity, recordNo, data) => {

  const profile = await EducationModel.findOne({ user: identity }).exec();
  if (!profile) {
    throw new ModelError({ message: "Education profile not found.", code: "RESOURCE_NOT_FOUND" });
  }
  // Check if the record exists before updating
  const recordExists = profile.educations.some((ach) => ach.recordNo === recordNo);
  if (!recordExists) {
    throw new ModelError({ message: "No matching education found.", code: "RESOURCE_NOT_FOUND" });
  }
  const isDuplicate = await EducationModel.isEducationDuplicate(identity, data, recordNo);
  if (isDuplicate) {
    throw new ValidatorError({
      errors: {
        "institution": "This Institute and Degree combination is already in use.",
        "degree": "This Institute and Degree combination is already in use."
      }
    });
  }
  data.startDate = provideCastDate(data.startDate);
  data.endDate = provideCastDate(data.endDate);
  const result = await EducationModel.findOneAndUpdate(
    { user: identity, "educations.recordNo": recordNo },
    {
      $set: {
        "educations.$.institution": data.institution,
        "educations.$.degree": data.degree,
        "educations.$.major": data.major || null,
        "educations.$.certificate": data.certificate,
        "educations.$.startDate": data.startDate,
        "educations.$.endDate": data.endDate
      }
    },
    {
      new: true,
      projection: { educations: { $elemMatch: { recordNo: recordNo } } }
    }
  );
  return { educations: result.educations };
};

const deleteEducation = async (identity, recordNo) => {

  const profile = await EducationModel.findOne({ user: identity }).exec();
  if (!profile) {
    throw new ModelError({ message: "Education profile not found.", code: "RESOURCE_NOT_FOUND" });
  }
  // Check if the record exists before updating
  const recordExists = profile.educations.some((ach) => ach.recordNo === recordNo);
  if (!recordExists) {
    throw new ModelError({ message: "No matching education found.", code: "RESOURCE_NOT_FOUND" });
  }
  // Prevent deleting the last education (Profile must retain at least one)
  if (profile.educations.length === 1) {
    throw new ModelError({
      message: "You must keep at least one education in your profile.",
      code: "MINIMUM_RECORD_REQUIRED"
    });
  }
  const result = await EducationModel.updateOne(
    { user: identity },
    { $pull: { educations: { recordNo } } },
    { new: true }
  );
  return result;
};

const EducationAction = {
  createEducation,
  getEducations,
  updateEducation,
  deleteEducation,
};

export default EducationAction;

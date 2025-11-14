/**
 * @module ConsultAction
 *
 * This module defines the actions related to user and its expert service settings
 */
import UserModel from "../models/user.model.js";
import ConsultationModel from "../models/consultation.model.js";
import RateModel from "../models/rate.model.js";
import TimingModel from "../models/timing.model.js";
import { validateConsultServices } from "../actions/platform.action.js";
import ApiError from "../exceptions/api.error.js";
import Time from "../enums/time.enum.js";

/**
 * @method manageServiceProfile
 *
 * Updates or creates a consultation service profile for an expert.
 * @param {string} expert - The expert's user ID.
 * @param {object} payload - The consultation profile data which includes:
 *   - serviceGroup: ID for the root-level service.
 *   - ancentor: ID for the child service.
 *   - services: Array of service IDs that should be children of the ancentor.
 *   - ... plus any additional profile fields.
 * @returns {Promise<object>} The updated or newly created consultation profile.
 */
const manageServiceProfile = async (expert, payload) => {
  let profile;
  const { serviceGroup, ancentor, services } = payload;
  const modelData = payload;
  await validateConsultServices(serviceGroup, ancentor, services);
  profile = await ConsultationModel.findOne({ user: expert }).exec();
  if (profile) {
    Object.assign(profile, payload);
    profile = await profile.save();
  } else {
    // No existing rate profile found, create a new one
    // Start a transaction session
    const trxQuery = await UserModel.initTransactionSession();
    await trxQuery.startTransaction();
    try {
      // Create a new profile if none exists.
      modelData.user = expert;
      const [newProfile] = await ConsultationModel.create([modelData], {
        session: trxQuery,
      });
      profile = newProfile;
      const docNo = ConsultationModel.provideDocID(newProfile, false);
      await UserModel.findByIdAndUpdate(
        expert,
        { profileExpertService: docNo },
        {
          session: trxQuery,
          new: true,
        }
      );
      // Save all data
      await trxQuery.commitTransaction();
    } catch (error) {
      // Rollback on error if abort set to true
      await trxQuery.abortTransaction();
      throw error;
    } finally {
      await trxQuery.endSession(); // Release session resources
    }
  } // end main else

  return profile;
}; // end fn {manageServiceProfile}

const manageServices = async (expert, payload) => {
  let profile;
  const { serviceGroup, ancentor, services } = payload;
  const modelData = payload;
  await validateConsultServices(serviceGroup, ancentor, services);
  profile = await ConsultationModel.findOne({ user: expert }).exec();
  if (profile) {
    Object.assign(profile, payload);
    profile = await profile.save();
  } else {
    // No existing rate profile found, create a new one
    // Start a transaction session
    const trxQuery = await UserModel.initTransactionSession();
    await trxQuery.startTransaction();
    try {
      // Create a new profile if none exists.
      modelData.user = expert;
      const [newProfile] = await ConsultationModel.create([modelData], {
        session: trxQuery,
      });
      profile = newProfile;
      const docNo = ConsultationModel.provideDocID(newProfile, false);
      await UserModel.findByIdAndUpdate(
        expert,
        { profileExpertService: docNo },
        {
          session: trxQuery,
          new: true,
        }
      );
      // Save all data
      await trxQuery.commitTransaction();
    } catch (error) {
      // Rollback on error if abort set to true
      await trxQuery.abortTransaction();
      throw error;
    } finally {
      await trxQuery.endSession(); // Release session resources
    }
  } // end main else

  return profile;
};

/**
 * @method  showServiceProfile
 * Retrieves the consultation service profile for a given expert.
 * @param {string} expert - The expert's user ID.
 * @returns {Promise<object|null>} The consultation profile if found; otherwise, null.
 */
const showServiceProfile = async (expert) => {
  const profile = await ConsultationModel.findOne({ user: expert }).exec();
  return profile;
}; // end fn {showServiceProfile}

/**
 * @method  manageRateProfile
 * Creates or updates the rate profile for an expert.
 *
 * @param {string} expert - The expert's user ID.
 * @param {object} payload - The rate profile data which includes:
 *   - enabledTrial: Flag indicating if a trial is enabled.
 *   - rates: An object with the rate values for audio, video, and message services.
 * @returns {Promise<object>} The updated or newly created rate profile.
 */
const manageRateProfile = async (expert, payload) => {
  let profile;
  const { enabledTrial, rates } = payload;
  const { audio, video, message } = rates;

  const audioRate = await RateModel.provideServiceRateMeta("audio", audio);
  const videoRate = await RateModel.provideServiceRateMeta("video", video);
  const messageRate = await RateModel.provideServiceRateMeta(
    "message",
    message
  );
  // Create a new Map to store rates. Keys must match your index definition, e.g., uppercase.
  const serviceRates = new Map();
  serviceRates.set("audio", audioRate);
  serviceRates.set("video", videoRate);
  serviceRates.set("message", messageRate);
  const modelData = {
    user: expert,
    enabledTrial: enabledTrial,
    rates: serviceRates,
  };
  profile = await RateModel.findOne({ user: expert }).exec();
  if (profile) {
    // Existing rate profile found, update it
    // Existing rate profile found, update its fields.
    profile.enabledTrial = modelData.enabledTrial;
    profile.rates = modelData.rates;
    // Save the updated document.
    profile = await profile.save();
  } else {
    // No existing rate profile found, create a new one
    // Start a transaction session
    const trxQuery = await UserModel.initTransactionSession();
    await trxQuery.startTransaction();
    try {
      // Create a new profile if none exists.
      const [newProfile] = await RateModel.create([modelData], {
        session: trxQuery,
      });
      profile = newProfile;
      const docNo = RateModel.provideDocID(newProfile, false);
      await UserModel.findByIdAndUpdate(
        expert,
        { profileExpertRate: docNo },
        {
          session: trxQuery,
          new: true,
        }
      );
      // Save all data
      await trxQuery.commitTransaction();
    } catch (error) {
      // Rollback on error if abort set to true
      await trxQuery.abortTransaction();
      throw error;
    } finally {
      await trxQuery.endSession(); // Release session resources
    }
  } // end main else
  return profile;
};

/**
 * @method  showRateProfile
 * Retrieves the rate profile for a given expert.
 *
 * @param {string} expert - The expert's user ID.
 * @returns {Promise<object|null>} The rate profile if found; otherwise, null.
 */
const showRateProfile = async (expert) => {
  const profile = await RateModel.findOne({ user: expert }).exec();
  return profile;
};

/**
 * @method  manageTimingProfile
 */
const manageTimingProfile = async (expert, slotData) => {
  const { startTime, endTime, days, repeatWeekly, enabledInstantMode } =
    slotData;

  const timeData = await TimingModel.parseSlotTime(startTime, endTime);
  const sheduleData = Object.assign({}, slotData, timeData);

  let isNewProfile, timingProfile, profile;
  // Retrieve or create the Timing document for the user
  isNewProfile = false;
  timingProfile = await TimingModel.findOne({ user: expert });

  //Create new profile
  if (!timingProfile) {
    const weekDays = Time.getWeekDays();
    const weeklySchedule = new Map();
    weekDays.forEach((day) => {
      weeklySchedule.set(day, [{ day, slots: [] }]);
    });
    timingProfile = new TimingModel({
      user: expert,
      timings: [],
      weeklySchedule,
      activeBookings: [],
    });
    isNewProfile = true;
  } // end fn {timingProfile}

  return {
    sheduleData,
    timingProfile,
  };
};

/**
 * @method  showTimingProfile
 * Retrieves the timing profile for a given expert.
 *
 * @param {string} expert - The expert's user ID.
 * @returns {Promise<object|null>} The timing profile if found; otherwise, null.
 */
const showTimingProfile = async (expert) => {
  const profile = await TimingModel.findOne({ user: expert }).exec();
  return profile;
};
const submitConsultationClientRating = async (identity, payload) => {
  return {
    identity,
    payload,
  };
};
const ConsultAction = {
  manageRateProfile,
  showRateProfile,
  manageServiceProfile,
  manageServices,
  showServiceProfile,
  manageTimingProfile,
  showTimingProfile,
  submitConsultationClientRating,
};
export default ConsultAction;

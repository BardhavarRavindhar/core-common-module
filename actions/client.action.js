/**
 * @module UserAction
 *
 * This module defines the actions related to user and its bio.
 */
import UserModel from "../models/user.model.js";
import RatingModel from "../models/rating.model.js";
import ApiError from "../exceptions/api.error.js";
import { getAuthProfile } from "../actions/user.action.js";
import { getCurrentUTC } from "../utils/timer.util.js";

const showClientProfile = async (identity) => {
  const populates = [
    {
      path: "profile",
      model: "Profile",
      select: "+about -user -address",
    },
    {
      path: "profileInterest",
      select: "interests",
      populate: {
        path: "interests",
        model: "Interest",
        select: "name", // Only include the name field from Interest documents
      },
    },
    {
      path: "socials.social",
      select: "_id name icon", // Include fields to populate
    },
    {
      path: "wallet",
      model: "Wallet",
    },
    {
      path: "spokenLanguages",
      model: "Language",
      select: "name code",
    },
  ];
  const profileProperty =
    " -profileExperience -profileAchievement -profileExpertise -profileExpertService -profileExpertRate -profileExpertTiming";
  const clientProfile = await UserModel.findById(identity)
    .select(profileProperty)
    .populate(populates)
    .exec();

  return clientProfile;
};

const enrollClientAsExpert = async (identity) => {
  // Check for User
  const account = await getAuthProfile(identity);
  if (account.expertEnrolledAt) {
    throw new ApiError({
      message: "Already enrolled for expert profile.",
      code: "BAD_REQUEST",
    });
  }
  account.expertEnrolledAt = getCurrentUTC();
  const profile = account.save();
  return profile;
};

const submitConsultationRating = async (identity, payload) => {
  return {
    identity,
    payload,
  };
};

const ProfileAction = {
  showClientProfile,
  enrollClientAsExpert,
  submitConsultationRating,
};
export default ProfileAction;

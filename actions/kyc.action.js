
/**
 * @module KycAction
 * 
 * This module defines methods to handle Kyc-related actions.
 */

import UserModel from "../models/user.model.js";
import AccountModel from "../models/account.model.js";
import KycProvider from "../providers/kyc.provider.js";
import { getCurrentUTC } from "../utils/timer.util.js";
import ApiError from "../exceptions/api.error.js";

const getKycProfile = async (client) => {
  return await AccountModel.findOne({ user: client }).exec();
}

const kycProfileVerified = async (uid, owner, type = 1) => {
  let profile;
  switch (type) {
    case 1:
      profile = await AccountModel.findOne({ "aadhaar.aadhaarNo": uid, user: { $ne: owner }, aadhaarVerifiedAt: { $ne: null } }).exec();
      break;
    case 2:
      profile = await AccountModel.findOne({ "pan.panNo": uid, user: { $ne: owner }, panVerifiedAt: { $ne: null } }).exec();
      break;
  }
  return profile;
}

const createKycProfile = async (user) => {
  let profile = await AccountModel.findOne({ user: user }).exec(); // Start a transaction session
  if (!profile) {
    const trxQuery = await UserModel.initTransactionSession();
    await trxQuery.startTransaction();
    try {
      const [newProfile] = await AccountModel.create([{ user: user }], { session: trxQuery });
      await UserModel.findByIdAndUpdate(user, { profileAccount: AccountModel.provideDocID(newProfile, false) }, {
        session: trxQuery,
        new: true,
      });
      await trxQuery.commitTransaction();
      profile = newProfile;

    } catch (error) {
      // Rollback on error if abort set to true
      await trxQuery.abortTransaction();
      throw error;
    } finally {
      await trxQuery.endSession(); // Release session resources
    }
  }
  return profile;
}


const manageBankProfile = async (client, payload) => {
  delete payload.accountNoConfirm;
  let profile = await createKycProfile(client);
  profile.bankAccount = payload;
  profile.bankAccountVerifiedAt = getCurrentUTC();
  profile = await profile.save();
  return profile;
}

const managePanProfile = async (client, payload) => {
  const panNo = payload.panNo;
  let profile = await createKycProfile(client);
  if (profile.panVerifiedAt) {
    throw new ApiError({ message: "PAN verification has already been processed.", code: "BAD_REQUEST" });
  }
  const kycProfile = await kycProfileVerified(panNo, client, 2);
  if (kycProfile) {
    throw new ApiError({ message: "Pan number already in use.", code: "CONFLICT" });
  }
  // Verify PAN using Surepass
  await KycProvider.verifyPan(panNo);

  profile.pan.panNo = panNo;
  profile.panVerifiedAt = getCurrentUTC();
  profile = await profile.save();
  return profile;
}

const manageAadhaarProfile = async (client, payload) => {
  const adhaarNo = payload.adhaarNo;

  let profile = await createKycProfile(client);
  if (profile.aadhaarVerifiedAt) {
    throw new ApiError({ message: "Aadhaar verification has already been processed.", code: "BAD_REQUEST" });
  }

  const kycProfile = await kycProfileVerified(adhaarNo, client);
  if (kycProfile) {
    throw new ApiError({ message: "Aadhaar number already in use.", code: "CONFLICT" });
  }

  // Check aadhaar veification
  const aadhaar = await KycProvider.verifyAadhaar(adhaarNo);
  if (aadhaar.success === undefined || aadhaar.success !== true) {
    throw new ApiError({ message: "Aadhaar verification request cannot be processed. Please try again later. ", code: "BAD_REQUEST" });
  }
  const documents = new Map();
  if (payload.aadhaarDocuments) {
    documents.set("front", payload.aadhaarDocuments.front);
    documents.set("back", payload.aadhaarDocuments.back);
  } else {
    documents.set("front", null);
    documents.set("back", null);
  }
  profile.aadhaar.client = aadhaar.data.client_id;
  profile.aadhaar.aadhaarNo = adhaarNo;
  profile.aadhaar.aadhaarDocuments = documents;
  profile = await profile.save();
  return profile;
}

const verifyAadhaarByOtp = async (client, payload) => {
  const adhaarNo = payload.adhaarNo;
  const code = payload.code;

  let profile = await createKycProfile(client);
  if (!profile.aadhaar.aadhaarNo) {
    throw new ApiError({ message: "Aadhaar verification process not started yet.", code: "BAD_REQUEST" });
  }
  if (profile.aadhaarVerifiedAt) {
    throw new ApiError({ message: "Aadhaar verification has already been processed.", code: "BAD_REQUEST" });
  }
  if (profile.aadhaar.aadhaarNo !== adhaarNo) {
    throw new ApiError({ message: "Aadhaar number has been changed during process.", code: "BAD_REQUEST" });
  }
  const kycProfile = await kycProfileVerified(adhaarNo, client);
  if (kycProfile) {
    throw new ApiError({ message: "Aadhaar number already in use.", code: "CONFLICT" });
  }
  // Check aadhaar veification
  await KycProvider.verifyAadhaarOtp(profile.aadhaar.client, code);
  profile.aadhaarVerifiedAt = getCurrentUTC();
  profile = await profile.save();
  return profile;
}
// Exporting actions
const KycAction = {
  getKycProfile,
  manageAadhaarProfile,
  verifyAadhaarByOtp,
  manageBankProfile,
  managePanProfile
};

export default KycAction;
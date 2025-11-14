/**
 * @module AuthService
 * 
 * This module provides handlers to manage app auth's route related logic
 */
import UserModel from "../models/user.model.js";
import ProfileModel from "../models/profile.model.js";
import WalletModel from "../models/wallet.model.js";
import SessionModel from "../models/session.model.js";
import JwtService from "../providers/jwt.provider.js";
import ApiError from "../../core/exceptions/api.error.js";
import { Validator } from "../../core/utils/validator.util.js";
import { getCurrentUTC } from "../utils/timer.util.js";
import { getAssignRoleByName } from "../actions/acl.action.js";
import { getAccountStateMeta, getKycStateMeta } from "../enums/account-state.enum.js";
import { getAccountProfile, getProfileQR, validSessionDevice } from "../../core/actions/user.action.js";
import { generateUniqueCode } from "../../core/utils/codegen.util.js";
import logger from "../utils/logger.util.js";
import { log } from "node:console";
import SessionAction from "./session.action.js";


/**
 * @method generateAuthTokens
 * Generates access and refresh tokens for the user.
 * @param {string} identity - The user identity.
 * @param {string} platform - The platform information.
 * @param {boolean} forSystem - Indicates if the tokens are for system use.
 * @returns {Object} - The generated tokens.
 */
const generateAuthTokens = async (identity, platform, forSystem, device) => {
  const tokenPayload = {
    identity,
    platform,
    forSystem,
    device
  }
  const JWT = new JwtService();
  const accessToken = JWT.signAccessToken(tokenPayload);
  const refreshToken = JWT.signRefreshToken(tokenPayload);
  const tokenData = {
    identity,
    platform,
    accessToken,
    refreshToken,
    device
  }
  return tokenData;
}// end fn {generateAuthTokens}

/**
 * @method getSessionData
 * Retrieves session data for the user.
 * @param {string} owner - The user identity.
 * @param {Object} profileData - The profile data.
 * @param {boolean} forSystem - Indicates if the session is for system use.
 * @param {boolean} create - Indicates if the session is being created.
 * @returns {Object} - The session data.
 */
const getSessionData = async (owner, profileData, forSystem, create = true) => {
  /** @info Get Tokens */
  const { platform, device, deviceAgent, ip, currentutc } = profileData;
  const tokenData = await generateAuthTokens(owner, platform, forSystem, device);

  /** @module Session */
  const sessionMeta = {
    deviceAgent: deviceAgent,
    ip: ip,
    loginAt: currentutc,
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken
  }
  if (create) {
    sessionMeta.device = device;
    sessionMeta.platform = platform;
    sessionMeta.user = owner;
    sessionMeta.createdAt = currentutc
  }
  return sessionMeta;
}// end fn {getSessionData}

/**
 * @method createProfileAccount
 * Creates a new profile account.
 * @param {boolean} mode - Indicates the mode (true for phone, false for email).
 * @param {Object} profileData - The profile data.
 * @returns {Object} - The created profile account.
 */
const createProfileAccount = async (mode, profileData) => {

  const accountMeta = {
    username: profileData.username,
    roleName: profileData.assignRole,
    status: profileData.status,
    statusNote: profileData.statusNote,
    forSystem: profileData.forSystem,
    registerAt: profileData.currentutc
  }
  /** @case 1: New Account using Phone  */
  if (mode) {
    accountMeta.phone = profileData.phone;
    accountMeta.phoneVerifiedAt = profileData.currentutc;
  }
  /** @case 2: New Account using email  */
  if (!mode) {
    accountMeta.phone = profileData.phone;
    accountMeta.phoneVerifiedAt = profileData.currentutc;
    accountMeta.email = profileData.email;
    accountMeta.emailVerifiedAt = profileData.currentutc;
  }

  /** @info : Start Trnasaction  */
  const trxQuery = await UserModel.initTransactionSession();
  await trxQuery.startTransaction();

  try {
    /** @model User */
    const [profileAccount] = await UserModel.create([accountMeta], { session: trxQuery });
    const owner = UserModel.provideDocID(profileAccount, false);

    /** @model Profile */
    const profileMeta = {
      user: owner,
      qrCode: profileData.qrcode,
      kycState: profileData.kycState,
      stateNote: profileData.kycStateNote
    }
    const [profile] = await ProfileModel.create([profileMeta], { session: trxQuery });

    /** @model Wallet */
    const walletMeta = { user: owner };
    const [wallet] = await WalletModel.create([walletMeta], { session: trxQuery });

    /** @model Session */
    const sessionMeta = await getSessionData(owner, profileData, profileAccount.forSystem);
    const [session] = await SessionModel.create([sessionMeta], { session: trxQuery });

    /** @model User */
    // Update Account meta with required associated profiles
    const deviceSession = new Map();
    deviceSession.set(profileData.device, profileData.deviceAgent);
    const modelData = {
      profile: UserModel.provideDocID(profile, false),
      wallet: UserModel.provideDocID(wallet, false),
      sessions: deviceSession
    }
    await UserModel.findByIdAndUpdate(owner, modelData, {
      session: trxQuery,
      new: true
    });

    /** @info Set Response data */
    const authPayload = {
      identity: owner,
      accessToken: sessionMeta.accessToken,
      refreshToken: sessionMeta.refreshToken,
      session: SessionModel.provideDocID(session, false),
      device: session.device,
      type: profileAccount.type
    }
    // Save transact query data
    await trxQuery.commitTransaction();
    return authPayload;
  } catch (error) {
    // Rollback query
    await trxQuery.abortTransaction();
    throw error;
  } finally {
    // Release session resources
    await trxQuery.endSession();
  }//end {try-catch}
}// end fn {createProfileAccount}

/**
 * @method manageProfileAccount
 * Manages the profile account based on the provided parameters.
 * @param {boolean} mode - Indicates the mode (true for phone, false for email).
 * @param {Object} profileData - The profile data.
 * @returns {Object} - The managed profile account.
 */
const manageProfileAccount = async (profileData) => {

  let accountSession;
  /** @info Extract data  */
  const { device, deviceAgent, phone, email, currentutc, revokeDeviceSession, assignEmail, assignPhone } = profileData;
  /** @model User */
  let profileAccount;
  if (phone) {
    console.log("phone mode in update");
    profileAccount = await getAccountProfile(phone);
    if (assignEmail && profileAccount.email) {
      const errors = { phone: phone, email: contact, assigned: assignEmail }
      throw new ApiError({ message: "Phone number already in use.", code: "CONFLICT", errors: errors });
    }
  } else {
    profileAccount = await getAccountProfile(email, false);
  }


  /** @info Set data for manage session */
  const owner = UserModel.provideDocID(profileAccount, false);
  const deviceSession = profileAccount.sessions;
  // logger.info(`"device session1 " ${JSON.stringify(deviceSession)}`)
  const newDevice = deviceSession.has(device) ? false : true;
  const validDevice = await validSessionDevice(owner, device);
  const invalidDevice = validDevice ? false : true;
  const sessionMeta = await getSessionData(owner, profileData, profileAccount.forSystem, invalidDevice);
  // logger.info(`session meta ${JSON.stringify(sessionMeta)}`)
  let count = deviceSession.size;
  if (revokeDeviceSession) { --count };
  if (newDevice) { ++count };

  /** @case 1: Active Account using Phone  */

  /** @info : Start Trnasaction  */
  const trxQuery = await UserModel.initTransactionSession();
  await trxQuery.startTransaction();

  try {
    /** @info revokeDevice sesion exists  */
    if (revokeDeviceSession && !deviceSession.has(revokeDeviceSession)) {
      throw new ApiError({
        message: "No device session found.",
        code: "RESOURCE_NOT_FOUND",
        errors: {
          device: revokeDeviceSession
        }
      });
    }
    /** @info Enforce max device session limit  */
    if (!revokeDeviceSession && count > SessionModel.limit) {
      // First try to remove the last inactive device session
      let removedSession = await findAndRemoveLastInactiveDevice(owner);
      
      // If no inactive session found, try to remove oldest session
      if (!removedSession) {
        removedSession = await SessionModel.findAndRemoveOldestInactiveSession(owner);
      }

      logger.info(`removedsession ${removedSession?.device}`)
      if (!removedSession) {
        throw new ApiError({
          message: "Unable to manage sessions. Please try again.",
          code: "RESOURCE_NOT_FOUND",
          errors: {
            device: removedSession
          }
        });
      }
      deviceSession.delete(removedSession?.device);
      count--;
    }

    // Handle revoking a device session
    if (revokeDeviceSession) {
      await SessionModel.findOneAndDelete({ user: owner, device: revokeDeviceSession }, { session: trxQuery });
      deviceSession.delete(revokeDeviceSession);
    }

    // Handle new or existing device session
    if (newDevice) {
      /** @model Session - New device */
      accountSession = await SessionModel.create([sessionMeta], { session: trxQuery });
      accountSession = accountSession[0];
      // Add new device to user's sessions Map
      deviceSession.set(device, deviceAgent);
    } else {
      logger.info(`device ${device} and ${owner}`)
      /** @model Session - Active device */
      accountSession = await SessionModel.findOneAndUpdate(
        { device: device, user: owner }, 
        sessionMeta,
        { session: trxQuery, new: true }
      );

      // If no session found, create a new one
      if (!accountSession) {
        
        logger.info(`No existing session found for device ${device}, creating new session `)
        accountSession = await SessionModel.create([sessionMeta], { session: trxQuery });
        accountSession = accountSession[0];
      }

      // Update existing device in user's sessions Map
      deviceSession.set(device, deviceAgent);
    }

    if(!accountSession){
      logger.info(`account session not found, ${JSON.stringify(sessionMeta)}`)
      throw new ApiError({
        message: "Failed to create or update device session.",
        code: "INTERNAL_SERVER_ERROR",
        errors: {
          device: device
        }
      });
    }
    /** @module User **/
    const accountMeta = {
      sessions: deviceSession
    }
    if (assignEmail || assignPhone) {
      accountMeta.email = email;
      accountMeta.emailVerifiedAt = currentutc;
    }
    // logger.info(`update user sessions and ${accountMeta}`)
    await UserModel.findByIdAndUpdate(owner, accountMeta, {
      session: trxQuery,
      new: true,
    });

    logger.info(`sesson ${JSON.stringify(accountSession)}`)
    logger.info(`"device session2 " ${JSON.stringify(deviceSession)}`)
    /** @info Set Response data */
    const authPayload = {
      identity: owner,
      accessToken: accountSession.accessToken,
      refreshToken: accountSession.refreshToken,
      session: SessionModel.provideDocID(accountSession, false),
      device: device,
      type: profileAccount.type
    }
    // logger.info(`auth payload ${JSON.stringify(authPayload)}`)
    logger.info(`"device session3 " ${JSON.stringify(deviceSession)}`)
    // Save transact query data
    await trxQuery.commitTransaction();
    return authPayload;
  } catch (error) {
    // Rollback query
    await trxQuery.abortTransaction();
    throw error;
  } finally {
    // Release session resources
    await trxQuery.endSession();
  }//end {try-catch}
}// end fn

/**
 * @method manageAccount
 * Manages account creation and updates based on the provided parameters.
 * @param {Object} params - The parameters for managing the account.
 * @param {boolean} params.exists - Indicates if the account already exists.
 * @param {boolean} params.mode - The mode of account creation (true for phone, false for email).
 * @param {boolean} params.emailAssigned - Indicates if an email is assigned.
 * @param {Object} params.payload - The payload containing account details.
 * @returns {Object} - The created or updated profile.
 */
const manageAccount = async ({ exists = false, mode = true, emailAssigned = false, payload }) => {

  /** @case 1: Authenticated Phone Account */
  if (mode & exists & !emailAssigned) {
    console.log("Active Phone Account");
    const profileData = await buildProfileData({ payload, create: false });
    const profile = await manageProfileAccount(profileData);
    return profile;
  }

  /** @case 2: Authenticated Account using Email */
  if (!mode & exists & !emailAssigned) {
    console.log("Active Email Account");
    const profileData = await buildProfileData({ payload, create: false });
    const profile = await manageProfileAccount(profileData);
    return profile;
  }

  /** @case 3: New Account using Phone */
  if (mode & !exists) {
    console.log("New Phone Account");
    const profileData = await buildProfileData({ payload });
    const profile = await createProfileAccount(mode, profileData);
    return profile;
  }

  /** @case 4: New Account using Email */
  if (!mode & !exists & emailAssigned) {
    console.log("New Email Account");
    const profileData = await buildProfileData({ payload });
    const profile = await createProfileAccount(mode, profileData);
    return profile;
  }

  /** @case 5: New Email assigned Existing Phone Account */
  if (mode & exists & emailAssigned) {
    console.log("Active Phone Account with Assigned New Email");
    const profileData = await buildProfileData({ payload, create: false });
    const profile = await manageProfileAccount(profileData);
    return profile;
  }

  throw new ApiError({ message: "Unknown API error. Please try again!!", code: "INTERNAL_SERVER_ERROR" });

}// end fn {manageAccount}

/**
 * @method buildProfileData
 * Builds profile data based on the provided parameters.
 * @param {Object} options - The options for building the profile data.
 * @param {Object} options.payload - The payload containing profile details.
 * @param {string} options.assignRole - The role to assign to the profile.
 * @param {boolean} options.create - Indicates if the profile is being created.
 * @returns {Object} - The built profile data.
 */
const buildProfileData = async ({ payload, assignRole = "User", create = true }) => {

  /** @info Destructure payload properties; also capture forSystem from payload if provided */
  const { forSystem = false, contact, device, deviceAgent, ip, platform, mode, assignEmail, assignPhone, revokeDeviceSession } = payload;

  /** @info Get the current UTC time and generate a new document ID for a username  */
  const currentutc = getCurrentUTC();
  const doc = generateUniqueCode(6);
  const username = `experta-${doc}`;


  /** @info Simplify boolean check; mode === "email" already returns a boolean  */
  const isEmailMode = mode === "email";

  /** @info  Build common profile data for both creation and update flows.  */
  const profileData = {
    ip,
    contact,
    platform,
    phone: isEmailMode ? null : contact,
    email: isEmailMode ? contact : null,
    device: device,
    deviceAgent,
    revokeDeviceSession,
    assignEmail: isEmailMode ? null : assignEmail,
    assignPhone,
    currentutc,
    forSystem: forSystem
  }
  /** @info Override phone with assignPhone if provided (ensuring consistent value) */
  if (assignPhone) {
    profileData.phone = assignPhone;
    profileData.assignEmail = null;
  }

  /** @info If creating a new profile, add additional fields. */
  if (create) {
    const Role = await getAssignRoleByName(assignRole);
    const statusMeta = getAccountStateMeta("ACTIVE");
    const qrcode = await getProfileQR(username);
    const stateMeta = await getKycStateMeta("NOT_VERIFIED");
    profileData.assignRole = Role.name;
    profileData.forSystem = Role.forSystem;
    profileData.username = username;
    profileData.status = statusMeta.status;
    profileData.statusNote = statusMeta.statusNote;
    profileData.kycState = stateMeta.state;
    profileData.kycStateNote = stateMeta.stateNote;
    profileData.qrcode = qrcode;
  }
  return profileData;
}// end fn


/**
 * @method confirmAuthMode
 * Determines whether the contact information is an email or phone number.
 * @param {string} contact - The contact information (email or phone number).
 * @returns {string} - 'email' if the contact is an email, 'phone' if the contact is a phone number.
 */
const confirmAuthMode = (contact) => {
  const rules = { contact: { type: "email" } };
  const payload = { contact: contact };
  const errors = Validator(rules, payload);
  // If errors means phone mode
  const mode = errors ? "phone" : "email";
  return mode;
}// end fn {confirmAuthMode}

/**
 * @method getProvideRefreshTokenSession
 * Retrieves a session based on the user identity and refresh token.
 * @param {string} identity - The user identity.
 * @param {string} token - The refresh token.
 * @returns {Object} - The session object.
 */
export const getProvideRefreshTokenSession = async (identity, token) => {
  return await SessionModel.findOne({ user: identity, refreshToken: token });
}

/**
 * @method provideRenewAuthSession
 * Renews an authentication session for the user.
 * @param {Object} params - The parameters for renewing the session.
 * @param {string} params.identity - The user identity.
 * @param {string} params.device - The device information.
 * @param {string} params.platform - The platform information.
 * @returns {Object} - The authentication payload containing new tokens and session ID.
 */
const provideRenewAuthSession = async (auth) => {
  const { identity, device, platform, forSystem, type } = auth;

  const tokenPayload = await generateAuthTokens(identity, platform, forSystem, device);
  const { accessToken } = tokenPayload;
  const session = await SessionModel.findOneAndUpdate({ user: identity, device: device }, { accessToken: accessToken }, {
    new: true,
  });
  const authPayload = {
    identity,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    session: SessionModel.provideDocID(session, false),
    device: device,
    type: type
  };
  return authPayload
}// end fn {provideRenewAuthSession}


/**
 * @method getActiveDeviceSession
 * Provide action session list
 * @param {string} deviceOwner 
 * @returns {string} - Active session list
 */
const getActiveDeviceSession = async (deviceOwner) => {
  const query = { user: deviceOwner };
  const columns = "device deviceAgent platform loginAt";
  const activeSessions = await SessionModel.find(query, columns).exec();
  return activeSessions;
}// end fn {getActiveDeviceSession}

/**
 * @method findAndRemoveLastInactiveDevice
 * Finds and removes the device session with the longest inactivity period
 * @param {string} deviceOwner - The user ID
 * @returns {Object|null} - The removed session or null if none found
 */
const findAndRemoveLastInactiveDevice = async (deviceOwner) => {
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  // Start transaction
  const trxQuery = await UserModel.initTransactionSession();
  await trxQuery.startTransaction();

  try {
    // Step 1: Find the device with the longest inactivity period
    const longestInactiveSession = await SessionModel.findOne({
      user: deviceOwner,
      loginAt: { $lt: oneDayAgo }  // Find sessions older than 24 hours
    }).sort({ loginAt: 1 });      // Sort by oldest first (ascending)

    if (longestInactiveSession) {
      // Step 2: Delete the session from SessionModel
      await SessionModel.deleteOne({ _id: longestInactiveSession._id }, { session: trxQuery });

      // Step 3: Get user and update sessions Map
      const user = await UserModel.findById(deviceOwner).session(trxQuery);
      if (!user) {
        throw new ApiError({ message: "User not found.", code: "RESOURCE_NOT_FOUND" });
      }

      // Step 4: Remove the device from user's sessions Map
      user.sessions.delete(longestInactiveSession.device);

      // Step 5: Save the updated user
      await user.save({ session: trxQuery });

      // Commit transaction
      await trxQuery.commitTransaction();
      return longestInactiveSession;
    }

    // If no session found, commit transaction and return null
    await trxQuery.commitTransaction();
    return null;
  } catch (error) {
    // Rollback transaction on error
    await trxQuery.abortTransaction();
    throw error;
  } finally {
    // End session
    await trxQuery.endSession();
  }
};

const revokeAuthOldDevice = async (deviceOwner, device) => {
  /** @info : Start Trnasaction  */
  const trxQuery = await UserModel.initTransactionSession();
  await trxQuery.startTransaction();

  try {
    // Step 1: Delete the device session from SessionModel
    const account = await UserModel.findById(deviceOwner).exec();
    logger.info(`account ${JSON.stringify(account)}`)
    if (!account) {
      throw new ApiError({ message: "invalid device owner.", code: "RESOURCE_NOT_FOUND" });
    }

    const revokeResult = await SessionModel.deleteOne({ user: deviceOwner, device }, { session: trxQuery });

    logger.info(`revoke result ${JSON.stringify(revokeResult)}`);
    if (revokeResult.deletedCount === 0) {
      throw new ApiError({ message: "Device not found or already revoked.", code: "RESOURCE_NOT_FOUND" });
    }

    // Step 2: Retrieve all active devices for the user from SessionModel
    const deviceSessions = account.sessions;

    logger.info(`device sessions ${JSON.stringify(deviceSessions)}`); 
    // Step 3: Delete signout device
    deviceSessions.delete(device);

    // Step 4: Update the user's session map
    await UserModel.updateOne(
      { _id: deviceOwner },
      { $set: { sessions: deviceSessions } }, // Replace old sessions
      { session: trxQuery, new: true }
    );

    // Save transact query data
    await trxQuery.commitTransaction();
    logger.info(`device sessions===>  ${JSON.stringify(deviceSessions)}`); 
    return deviceSessions;
  } catch (error) {
    // Rollback query
    await trxQuery.abortTransaction();
    throw error;
  } finally {
    // Release session resources
    await trxQuery.endSession();
  }//end {try-catch}
}

/**
 * Revokes authentication for a specific device owned by a user
 * @param {string} deviceOwner - ID of the user who owns the device
 * @param {string} device - Device ID to revoke
 * @returns {Map} Updated sessions map after revocation
 */
const revokeAuthDevice = async (deviceOwner, device) => {
  /** @info : Start Transaction  */
  const trxQuery = await UserModel.initTransactionSession();
  await trxQuery.startTransaction();

  try {
    // Step 1: Find the account and validate device owner
    const account = await UserModel.findById(deviceOwner).session(trxQuery).exec();
    logger.info(`Account: ${JSON.stringify(account)}`);
    
    if (!account) {
      throw new ApiError({ message: "Invalid device owner.", code: "RESOURCE_NOT_FOUND" });
    }

    // Step 2: Delete the device session from SessionModel
    const revokeResult = await SessionModel.deleteOne(
      { user: deviceOwner, device }, 
      { session: trxQuery }
    );

    logger.info(`Revoke result: ${JSON.stringify(revokeResult)}`);
    if (revokeResult.deletedCount === 0) {
      throw new ApiError({ message: "Device not found or already revoked.", code: "RESOURCE_NOT_FOUND" });
    }

    // Step 3: Retrieve all active devices for the user
    const deviceSessions = account.sessions || new Map();
    logger.info(`Current device sessions: ${JSON.stringify([...deviceSessions])}`);
    
    // Step 4: Remove the signed-out device from sessions
    if (deviceSessions.has(device)) {
      deviceSessions.delete(device);
      logger.info(`Device ${device} removed from sessions`);
    } else {
      logger.warn(`Device ${device} not found in user's sessions map, but was in SessionModel`);
    }

    // Step 5: Clean up any orphaned sessions in the user's sessions map
    // Get all devices from the user's sessions map
    const userDevices = Array.from(deviceSessions.keys());
    
    // Find all actual sessions for this user
    const actualSessions = await SessionModel.find({ 
      user: deviceOwner 
    }).session(trxQuery);
    
    // Create a set of devices that have actual sessions
    const validDevices = new Set(actualSessions.map(session => session.device));
    
    // Find devices in the map that don't have corresponding sessions
    const invalidDevices = userDevices.filter(device => !validDevices.has(device));
    
    // Remove invalid entries from the user's sessions map
    let removedCount = 0;
    if (invalidDevices.length > 0) {
      invalidDevices.forEach(device => {
        deviceSessions.delete(device);
        removedCount++;
      });
      
      logger.info(`Cleaned up ${removedCount} orphaned sessions from user's sessions map`);
    }

    // Step 6: Update the user's session map in UserModel
    await UserModel.updateOne(
      { _id: deviceOwner },
      { $set: { sessions: deviceSessions } },
      { session: trxQuery }
    );

    // Commit transaction
    await trxQuery.commitTransaction();
    logger.info(`Updated device sessions: ${JSON.stringify([...deviceSessions])}`);
    
    return deviceSessions;
  } catch (error) {
    // Rollback transaction on error
    await trxQuery.abortTransaction();
    logger.error(`Error revoking device authentication: ${error.message}`, { error });
    throw error;
  } finally {
    // Always release session resources
    await trxQuery.endSession();
  }
};

// You could run this periodically as a maintenance task
const cleanAllUserSessions = async () => {
  const users = await UserModel.find({});
  for (const user of users) {
    await SessionAction.validateUserSessionMap(user._id);
  }
  // console.log("Completed session validation for all users");
}


// Export the AuthAction object containing all methods
const AuthAction = {
  confirmAuthMode,
  manageAccount,
  getProvideRefreshTokenSession,
  provideRenewAuthSession,
  getActiveDeviceSession,
  revokeAuthDevice,
  cleanAllUserSessions
}

export default AuthAction;

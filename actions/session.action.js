/**
 * @module SessionAction
 * 
 * This module defines the actions related to user sessions and authentication.
 */
import UserModel from "../models/user.model.js";
import SessionModel from "../models/session.model.js";
import mongoose from "mongoose";

/**
 * @method getUserSession
 * Retrieves a user session by its ID.
 *
 * @param {string} sessionId - The unique ID of the session.
 * @returns {Promise<Object|null>} - A promise that resolves to the session object if found, or null otherwise.
 */
export const getUserSession = async (sessionId) => {
  return await SessionModel.findById(sessionId).exec();
}// end fn {getUserSession}

/**
 * @method getUserActiveSessions
 * Retrieves all active sessions for a specific user.
 *
 * @param {string} userId - The unique ID of the user.
 * @returns {Promise<Array>} - A promise that resolves to an array of active session objects.
 */
export const getUserActiveSessions = async (userId) => {
  return await SessionModel.find({ 
    user: userId,
    logoutAt: null 
  }).exec();
}// end fn {getUserActiveSessions}

/**
 * @method getDeviceSession
 * Retrieves a session for a specific user on a specific device.
 *
 * @param {string} userId - The unique ID of the user.
 * @param {string} device - The device identifier.
 * @returns {Promise<Object|null>} - A promise that resolves to the session object if found, or null otherwise.
 */
export const getDeviceSession = async (userId, device) => {
  return await SessionModel.findOne({ 
    user: userId, 
    device: device 
  }).exec();
}// end fn {getDeviceSession}

/**
 * @method terminateSession
 * Terminates a session by its ID and removes it from the user's sessions map.
 *
 * @param {string} sessionId - The unique ID of the session to terminate.
 * @returns {Promise<boolean>} - A promise that resolves to true if successful, false otherwise.
 */
export const terminateSession = async (sessionId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find the session to get user and device info
    const sessionDoc = await SessionModel.findById(sessionId).session(session);
    if (!sessionDoc) {
      await session.abortTransaction();
      return false;
    }
    
    // Delete the session
    await SessionModel.deleteOne({ _id: sessionId }).session(session);
    
    // Update the user's sessions Map
    const user = await UserModel.findById(sessionDoc.user).session(session);
    if (user && user.sessions.has(sessionDoc.device)) {
      user.sessions.delete(sessionDoc.device);
      await user.save({ session });
    }
    
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}// end fn {terminateSession}

/**
 * @method terminateUserSessions
 * Terminates all sessions for a specific user and clears their sessions map.
 *
 * @param {string} userId - The unique ID of the user.
 * @returns {Promise<number>} - A promise that resolves to the number of terminated sessions.
 */
export const terminateUserSessions = async (userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Delete all sessions for this user
    const result = await SessionModel.deleteMany({ 
      user: userId 
    }).session(session);
    
    // Clear the user's sessions Map completely
    const user = await UserModel.findById(userId).session(session);
    if (user) {
      user.sessions.clear(); // Remove all entries from the Map
      await user.save({ session });
    }
    
    await session.commitTransaction();
    return result.deletedCount;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}// end fn {terminateUserSessions}

/**
 * @method terminateDeviceSession
 * Terminates a session for a specific user on a specific device.
 *
 * @param {string} userId - The unique ID of the user.
 * @param {string} device - The device identifier.
 * @returns {Promise<boolean>} - A promise that resolves to true if successful, false otherwise.
 */
export const terminateDeviceSession = async (userId, device) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Delete the session
    const result = await SessionModel.deleteOne({ 
      user: userId, 
      device: device 
    }).session(session);
    
    if (result.deletedCount === 0) {
      await session.abortTransaction();
      return false;
    }
    
    // Update the user's sessions Map
    const user = await UserModel.findById(userId).session(session);
    if (user && user.sessions.has(device)) {
      user.sessions.delete(device);
      await user.save({ session });
    }
    
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}// end fn {terminateDeviceSession}

/**
 * @method isValidSession
 * Checks if a session is valid based on its token.
 *
 * @param {string} accessToken - The access token to validate.
 * @returns {Promise<Object|null>} - A promise that resolves to the session if valid, or null otherwise.
 */
export const isValidSession = async (accessToken) => {
  return await SessionModel.findOne({ 
    accessToken: accessToken,
    logoutAt: null
  }).exec();
}// end fn {isValidSession}


/**
 * @method validateUserSessionMap
 * Validates a user's sessions map against existing sessions in the database
 * and removes any session entries from the map that don't have corresponding
 * session documents in the SessionModel.
 *
 * @param {string} userId - The unique ID of the user.
 * @returns {Promise<Object>} - A promise that resolves to an object with validation results.
 */
export const validateUserSessionMap = async (userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get the user with their sessions map
      const user = await UserModel.findById(userId).session(session);
      if (!user || !user.sessions || user.sessions.size === 0) {
        await session.commitTransaction();
        return { 
          validated: true, 
          removedCount: 0, 
          message: "No sessions to validate" 
        };
      }
      
      // Get all devices from the user's sessions map
      const userDevices = Array.from(user.sessions.keys());
      
      // Find all actual sessions for this user
      const actualSessions = await SessionModel.find({ 
        user: userId 
      }).session(session);
      
      // Create a set of devices that have actual sessions
      const validDevices = new Set(actualSessions.map(session => session.device));
      
      // Find devices in the map that don't have corresponding sessions
      const invalidDevices = userDevices.filter(device => !validDevices.has(device));
      
      // Remove invalid entries from the user's sessions map
      let removedCount = 0;
      if (invalidDevices.length > 0) {
        invalidDevices.forEach(device => {
          user.sessions.delete(device);
          removedCount++;
        });
        
        // Save the updated user
        await user.save({ session });
      }
      
      await session.commitTransaction();
      return {
        validated: true,
        removedCount,
        invalidDevices,
        message: removedCount > 0 
          ? `Removed ${removedCount} invalid session entries from user's map` 
          : "All sessions are valid"
      };
    } catch (error) {
      await session.abortTransaction();
      return {
        validated: false,
        error: error.message,
        message: "Failed to validate sessions"
      };
    } finally {
      await session.endSession();
    }
  };
  

const SessionAction = {
  getUserSession,
  getUserActiveSessions,
  getDeviceSession,
  terminateSession,
  terminateUserSessions,
  terminateDeviceSession,
  isValidSession,
  validateUserSessionMap
}

export default SessionAction;



// // Check if a user has a valid session on a device
// const deviceSession = await SessionAction.getDeviceSession(userId, deviceId);

// // Terminate all sessions for a user (logout from all devices)
// const terminatedCount = await SessionAction.terminateUserSessions(userId);

// // Terminate a specific session by ID
// const success = await SessionAction.terminateSession(sessionId);
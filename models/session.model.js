/**
 * @module SessionModel
 * 
 * This module defines the Mongoose schema and model for manage user's active session.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";
import Platform from "../enums/platform.enum.js";
import Socialite from "../enums/socialite.enum.js";
import { getLocalCalenderAgo } from "../utils/timer.util.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Session";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: ["id"],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  device: {
    type: String,
    required: true
  },
  deviceAgent: {
    type: String,
    required: true
  },
  fcmToken: {
    type: String,
    default: null
  },
  ip: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    trim: true,
    uppercase: true,
    enum: Platform.getAllModes(),
    required: true
  },
  provider: {
    type: String,
    enum: {
      values: Socialite.getAllProviders(),
      message: "{VALUE} is not supported"
    },
    default: "PLATFORM"
  },// hold name of social provider if login by sso
  loginAt: {
    type: Date,
    default: null,
    get: function (isodate) {
      // Check if the value is not null and then format it
      if (isodate) {
        return getLocalCalenderAgo(isodate);
      }
      return isodate;
    }
  },
  logoutAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: null
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Define methods and properties related to Schema and Model **/
ModelSchema.statics.limit = 5;

// ModelSchema.statics.cleanExpiredSessions = async function() {
//   const oneDayAgo = new Date();
//   oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  
//   // Remove all sessions older than 24 hours
//   const result = await this.deleteMany({
//     createdAt: { $lt: oneDayAgo }
//   });
  
//   return result;
// };

ModelSchema.statics.findAndRemoveOldestInactiveSession = async function(userId) {
  // Start transaction
  const trxQuery = await this.initTransactionSession();
  await trxQuery.startTransaction();

  try {
    // Step 1: Find the oldest session for this user
    const oldestSession = await this.findOne({ 
      user: userId 
    }).sort({ loginAt: 1 }); // Sort by login time ascending (oldest first)

    if (oldestSession) {
      // Step 2: Delete the session from SessionModel
      await this.deleteOne({ _id: oldestSession._id }, { session: trxQuery });

      // Step 3: Get user and update sessions Map
      const user = await this.model('User').findById(userId).session(trxQuery);
      if (!user) {
        throw new Error("User not found");
      }

      // Step 4: Remove the device from user's sessions Map
      user.sessions.delete(oldestSession.device);

      // Step 5: Save the updated user
      await user.save({ session: trxQuery });

      // Commit transaction
      await trxQuery.commitTransaction();
      return oldestSession;
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

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Unique index to enforce session uniqueness
ModelSchema.index({ user: 1, device: 1 }, { unique: true, name: "unique_user_session" });
// Compound index for efficient filtering of active documents
ModelSchema.index({ user: 1, provider: 1, createdAt: 1 }, { name: "idx_session_user_provider_createdat" });
ModelSchema.index({ device: 1, provider: 1, createdAt: 1 }, { name: "idx_session_device_provider_createdat" });

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
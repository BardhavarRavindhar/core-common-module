/**
 * @module ProfileModel
 *
 * This module defines the Mongoose schema and model for user's profile.
 *
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";
import { getKycStates } from "../enums/account-state.enum.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Profile";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [
    "name",
    "dateOfBirth",
    "gender",
    "languages",
    "socialMediaHandles",
  ],
  guarded: [],
  sortKeys: ["id"],
  defaultSortKey: "id",
  defaultSortOrder: "desc",
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, "Name must be no longer than 100 characers"],
    default: null,
  },
  profileTag: {
    type: String,
    trim: true,
    default: null,
  },
  profileBadges: {
    type: Map,
    of: String,
    default: () => new Map(), // Default to an empty Map
  },
  dateOfBirth: {
    type: String,
    default: null,
  },
  gender: {
    type: String,
    trim: true,
    uppercase: true,
    enum: ["MALE", "FEMALE", "PREFER", null],
    default: null,
  },
  qrCode: {
    type: String,
    trim: true,
    select: false,
    default: null,
  },
  about: {
    type: String,
    select: false,
    default: "",
    maxlength: [2500, "Input must be no longer than 2500 characers"],
  },
  city: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    default: null,
  },
  kycVerifiedAt: {
    type: Date,
    default: null,
  }, //When kyc completed
  kycState: {
    type: String,
    trim: true,
    uppercase: true,
    enum: {
      values: getKycStates(),
      message: "{VALUE} is not supported",
    },
  }, //Indicate KYC status
  kycStateNote: {
    type: String,
    trim: true,
    default: null,
  },

  profileProgressScore: {
    type: Number,
    min: 0,
    max: 100, // score is typically between 0 and 100 calculated on weight scores
    default: 0,
  }, //manage profile completion score

  expertProfileProgressScore: {
    type: Number,
    min: 0,
    max: 100, // score is typically between 0 and 100 calculated on weight scores
    default: 0,
  }, //manage profile completion score

  isCompleted: {
    type: Boolean,
    default: false,
  },
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Unique index to enforce profile user uniqueness
ModelSchema.index({ user: 1 }, { unique: true, name: "unique_profile_user" });
// Compound index for efficient filtering of active documents
ModelSchema.index(
  { kycVerifiedAt: 1, user: 1 },
  { name: "idx_profile_kyc_user" }
);

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;

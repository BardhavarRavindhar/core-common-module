/**
 * @module FollowModel
 * 
 * This module defines the Mongoose schema and model for follow relationships.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";
import { getCurrentUTC } from "../utils/timer.util.js";

const { Schema, model } = mongoose;
const ModelName = "Follow";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: ["follower", "following"],
  guarded: [],
  sortKeys: ["id", "follower", "following"],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the follow document in MongoDB **/
const schemaRules = {
  follower: {
    type: Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: [true, "Follower is required"]
  },// Expert Only
  following: {
    type: Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: [true, "Following is required"]
  }, // User or Experts
  followAt: {
    type: Date,
    default: getCurrentUTC()
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Create a unique index to prevent duplicate follow relationships
ModelSchema.index({ follower: 1, following: 1 }, { unique: true, name: "unique_follow_relationship" });

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
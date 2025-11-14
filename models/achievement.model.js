/**
 * @module AchievementModel
 * 
 * This module defines the Mongoose schema and model for storing user achievements.
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Achievement";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: [],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  */
const achievementEntrySchema = new Schema({
  url: {
    type: String,
    empty: false,
    trim: true,
    required: true,
    lowercase: true,
    set: function (url) {
      return encodeURI(url);
    }
  },
  title: {
    type: String,
    default: null,
    trim: true,
    maxlength: [100, "Achievement title must be no longer than 100 characers"]
  },
  earnedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  achievements: {
    type: [achievementEntrySchema],
    default: []
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Define methods and properties related to Schema and Model **/
ModelSchema.statics.limit = 3;

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Create a case-insensitive unique index for the 'user' field
ModelSchema.index({ user: 1 }, { unique: true, name: "unique_achievement_profile" });
ModelSchema.index({ user: 1, "achievements.url": 1 }, { unique: true, name: "unique_user_achievement_url" });

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
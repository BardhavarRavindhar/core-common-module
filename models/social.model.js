/**
 * @module SocialModel
 * 
 * This module defines the Mongoose schema and model for social platforms like twiiter, instagram etc.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Social";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: ["name", "icon", "code", "enabled"],
  guarded: [],
  sortKeys: ["id", "name", "code", "enabled"],
  defaultSortKey: "code",
  defaultSortOrder: "asc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  name: {
    type: String,
    trim: true,
    required: [true, "Social name is required"],
    maxlength: [70, "Social name must be no longer than 70 characters"]
  },
  icon: {
    type: String,
    trim: true,
    default: null
  },
  code: {
    type: String,
    required: [true, "Social code is required"],
    lowercase: true,
    immutable: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  countUser: {
    type: Number,
    min: [0, "countUser value must be at least 0"],
    default: 0,
    validate: {
      validator: Number.isInteger, // Ensure the value is an integer
      message: "countUser value must be an integer",
    }
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Unique index to enforce code uniqueness
ModelSchema.index({ code: 1 }, { unique: true, name: "unique_social_code" });
// Compound index for efficient filtering of active documents
ModelSchema.index({ enabled: 1, code: 1 }, { name: "idx_social_enabled_code" });

/** @info Define methods and properties related to Schema and Model **/
ModelSchema.statics.limit = 5;

/**
 * @method buildQuery
 * @info Static method to build query objects based on query params
 * @param {Object<key:value>} params
 */
ModelSchema.statics.buildQuery = async (params) => {
  let query = {}, regex;
  query.enabled = true;
  if (params.search !== undefined) {
    regex = ModelSchema.statics.getSearchRegex(params.search, 1);
    query.name = { $regex: regex };
  }
  return query;
};

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
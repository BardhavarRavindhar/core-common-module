/**
 * @module LanguageModel
 * 
 * This module defines the Mongoose schema and model for language spoken by world.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Language";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: ["name", "code", "enabled"],
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
    required: [true, "Language name is required"],
    maxlength: [70, "Language name must be no longer than 70 characters"]
  },
  code: {
    type: String,
    required: [true, "Language code is required"],
    lowercase: true,
    minlength: [2, "Language code must be atleast 2 letter ISO code"],
    maxlength: [6, "Language code must be no longer than 6 letter ISO code"],
    immutable: true
  },
  enabled: {
    type: Boolean,
    default: true
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Unique index to enforce code uniqueness
ModelSchema.index({ code: 1 }, { unique: true, name: "unique_language_code" });
// Compound index for efficient filtering of active documents
ModelSchema.index({ enabled: 1, code: 1 }, { name: "idx_language_enabled_code" });

/** @info Define methods and properties related to Schema and Model **/
ModelSchema.statics.limit = 10;

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
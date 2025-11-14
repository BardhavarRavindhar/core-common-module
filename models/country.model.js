/**
 * @module CountryModel
 * 
 * This module defines the Mongoose schema and model for country.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Country";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: ["name", "flag", "code", "enabled"],
  guarded: [],
  sortKeys: ["id", "code", "enabled"],
  defaultSortKey: "code",
  defaultSortOrder: "asc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  name: {
    type: String,
    trim: true,
    required: [true, "Country name is required"],
    maxlength: [70, "Country name must be no longer than 70 characters"],
  },
  flag: {
    type: String,
    default: null
  }, // Store flag image url
  code: {
    type: String,
    required: [true, "Country iso-code is required"],
    uppercase: true,
    minlength: [3, "Code must be 3 letter ISO country code"],
    maxlength: [3, "Code must be 3 letter ISO country code"],
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
// Unique index to enforce country code uniqueness
ModelSchema.index({ code: 1 }, { unique: true, name: "unique_country_code" });
// Compound index for efficient filtering of active documents
ModelSchema.index({ enabled: 1, code: 1 }, { name: "idx_country_enabled_code" });

/** @info Define methods related to Schema and Model **/

/**
 * @method buildQuery
 * @info Static method to build query objects based on query params
 * @param {Object<key:value>} params
 */
ModelSchema.statics.buildQuery = async (params) => {
  let query = {};
  query.enabled = true;
  query.code = { $eq: "IND" };
  return query;
};

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
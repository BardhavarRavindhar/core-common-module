/**
 * @module ProvinceModel
 * 
 * This module defines the Mongoose schema and model for province.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Province";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: ["name", "code", "countryCode", "enabled"],
  guarded: [],
  sortKeys: ["id", "code", "countryCode", "enabled"],
  defaultSortKey: "code",
  defaultSortOrder: "asc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  name: {
    type: String,
    required: [true, "State name is required"],
    trim: true,
    maxlength: [70, "State name must be no longer than 70 characters"]
  },
  code: {
    type: String,
    required: [true, "State code is required"],
    uppercase: true,
    minlength: [2, "State code must be 2 letter ISO state code"],
    maxlength: [2, "State code must be 2 letter ISO state code"],
    immutable: true
  },
  countryCode: {
    type: String,
    uppercase: true,
    minlength: [3, "Code must be 3 letter ISO country code"],
    maxlength: [3, "Code must be 3 letter ISO country code"],
    default: "IND"
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
ModelSchema.index({ code: 1 }, { unique: true, name: "unique_province_code" });
// Compound index for efficient filtering of active documents
ModelSchema.index({ enabled: 1, countryCode: 1 }, { name: "idx_province_enabled_country" });
ModelSchema.index({ countryCode: 1, code: 1 }, { name: "idx_province_country_provincecode" });

/** @info Define methods related to Schema and Model **/

/**
 * @method buildQuery
 * @info Static method to build query objects based on query params
 * @param {Object<key:value>} params
 */
ModelSchema.statics.buildQuery = async (params) => {
  let query = {}, regex;
  query.enabled = true;
  if (params.search !== undefined) {
    regex = await ModelSchema.statics.getSearchRegex(params.search, 1);
    query.name = { $regex: regex };
  }
};

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
/**
 * @module ExpertiseModel
 * 
 * This module defines the Mongoose schema and model for expertise.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Expertise";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: ["name", "icon", "enabled"],
  guarded: [],
  sortKeys: ["id", "name", "enabled"],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  name: {
    type: String,
    trim: true,
    required: [true, "Expertise name is required"],
    maxlength: [70, "Expertise name must be no longer than 70 characers"],
  },
  icon: {
    type: String,
    default: null
  },
  enabled: {
    type: Boolean,
    default: true
  },
  countExpert: {
    type: Number,
    min: [0, "countExpert value must be at least 0"],
    default: 0,
    validate: {
      validator: Number.isInteger, // Ensure the value is an integer
      message: "countExpert value must be an integer"
    }
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Create a case-insensitive unique index for the 'name' field
ModelSchema.index({ name: 1 }, { unique: true, name: "unique_expertise_name", collation: { locale: "en", strength: 2 } });
// Compound index for efficient filtering of active documents
ModelSchema.index({ enabled: 1, name: 1 }, { name: "idx_expertise_enabled_name" });

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
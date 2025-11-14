/**
 * @module ProficiencyModel
 * @alias Expertise
 * This module defines the Mongoose schema and model for user proficiency refer global expertise
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Proficiency";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: ["name", "icon", "enabled"],
  guarded: [],
  sortKeys: ["id", "name", "enabled"],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const ExpertiseEntrySchema = new Schema({
  expertise: {
    type: Schema.Types.ObjectId,
    ref: "Expertise",
    required: true,
  },
  level: {
    type: String,
    default: null
  },
  score: {
    type: Number,
    default: 0,
  }
}, { _id: false });

const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  expertises: {
    type: [ExpertiseEntrySchema],
    default: []
  }
};


const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Define methods and properties related to Schema and Model **/
ModelSchema.statics.limit = 15;

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Create a case-insensitive unique index for the 'user' field
ModelSchema.index({ user: 1 }, { unique: true, name: "unique_proficiency_profile" });
ModelSchema.index({ user: 1, "expertises.expertise": 1 }, { unique: true, name: "unique_proficiency_record" });


/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;

/**
 * @module MediaModel
 * 
 * This module defines the Mongoose schema and model for storing user all proficiency.
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Experience";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: [],
  defaultSortKey: "startDate",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  */
const experienceEntrySchema = new Schema({
  recordNo: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, "Job title must be no longer than 100 characers"],
  },
  organization: {
    type: String,
    default: "null",
    trim: true,
    maxlength: [100, "Organization name must be no longer than 70 characers"],
  },
  activeEmployee: {
    type: Boolean,
    default: false
  },
  certificate: {
    type: String,
    default: null
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
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
  experiences: {
    type: [experienceEntrySchema],
    default: []
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Create a case-insensitive unique index for the 'user' field
ModelSchema.index({ user: 1 }, { unique: true, name: "unique_experience_profile" });
ModelSchema.index({ "experiences.recordNo": 1 }, { unique: true, name: "unique_experience_record" });
ModelSchema.index({ "experiences.startDate": 1 }, { name: "idx_experience_startdate" });


/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
/**
 * @module Consultation
 * @alias ExpertService for Industry
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Consultation";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: ["user"],
  defaultSortKey: "user",
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Expert user
  designation: {
    type: String,
    required: true,
    trim: true
  },
  serviceGroup: {
    type: Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  }, // Check for service level one or called as Industory
  ancentor: {
    type: Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  }, // Check for service level one or called as Industory
  services: [{
    type: Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  }], // Occupation type means service given by expert under service 3
  registrationNo: {
    type: String,
    default: null,
    trim: true,
  },
  experiencedSince: {
    type: Number,
    default: null,
    min: [1950, 'Year must be later than 1950'],
    max: [new Date().getFullYear(), 'Year cannot exceed the current year'],
  },
  certificate: {
    type: String,
    default: null,
  },
  enabled: {
    type: Boolean,
    default: true
  }
};

/** @info  Apply the SchemaComposePlugin to the schema **/
const ModelSchema = new Schema(schemaRules);
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info  Apply indexes to support query improvement and avoid conflicts **/
// 1. Each user can only have one Consultation record.
ModelSchema.index({ user: 1 }, { unique: true, name: "unique_consultation_user" });
ModelSchema.index({ user: 1, serviceGroup: 1 }, { name: "idx_consultation_user_group" });

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;

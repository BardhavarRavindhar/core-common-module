/**
 * @module PassionModel
 * 
 * This module defines the Mongoose schema and model for storing user passions.
 * A "passion" represents a user-selected interest derived from a global list of interests.
 * It links a user with a globally defined interest.
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Passion";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: [],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  interests: [
    {
      type: Schema.Types.ObjectId,
      ref: "Interest",
    }
  ]
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Define methods and properties related to Schema and Model **/
ModelSchema.statics.limit = 5;

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Create a case-insensitive unique index for the 'user' field
ModelSchema.index({ user: 1 }, { unique: true, name: "unique_interest_profile" });

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
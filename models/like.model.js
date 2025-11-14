/**
 * @module LikeModel
 * 
 * This module defines the Mongoose schema and model for storing likes.
 * A "like" represents a user's approval of a post.
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model } = mongoose;
const ModelName = "Like";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: [],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

const schemaRules = {
  user:{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User reference is required."]
  },
  refId: {
    type: Schema.Types.ObjectId,
    required: [true, "Reference ID is required."]
  },
  refType: {
    type: String,
    enum: ['Post', 'Comment'],
    required: [true, "Reference type is required."]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Add indexes for faster search **/
ModelSchema.index({ refId: 1, refType: 1 }, { unique: true });
ModelSchema.index({ refType: 1 });

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
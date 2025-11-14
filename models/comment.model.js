/**
 * @module CommentModel
 * 
 * This module defines the Mongoose schema and model for storing comments.
 * A "comment" represents a user's feedback or response to a post.
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model } = mongoose;
const ModelName = "Comment";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: [],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User reference is required."]
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, "Post reference is required."]
  },
  content: {
    type: String,
    required: [true, "Content is required."],
    maxlength: [1000, "Content must not exceed 1000 characters."]
  },
  reply: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  likesCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["active", "inactive", "deleted", "flagged", "approved", "pending"],
    default: "active"
  },
  statusNote: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
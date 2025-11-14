/**
 * @module PostModel
 * 
 * This module defines the Mongoose schema and model for storing posts.
 * A "post" represents user-generated content that can include text, images, or other media.
 * It links a user with their created content and metadata.
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Post";

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
    required: [true, "User reference is required."]
  },
  postType: {
    type: String,
    enum: {
      values: ['text', 'image', 'video'],
      message: "Post type must be one of 'text', 'image', or 'video'."
    },
    default: 'text'
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [1000, "Caption must not exceed 1000 characters."],
    default: null
  },
  hashtags: {
    type: [String],
    trim: true,
    lowercase: true,
    validate: {
      validator: function (value) {
        return value.length <= 30;
      },
      message: "Hashtags array must not exceed 30 items."
    },
    default: []
  },
  postStatus: {
    type: String,
    enum: {
      values: ['PUBLISHED', 'DRAFT', 'ARCHIVED', 'BANNED'],
      message: "Post status must be one of 'PUBLISHED', 'DRAFT', 'ARCHIVED', or 'BANNED'."
    },
    default: 'DRAFT'
  },
  postStatusNote: {
    type: String,
    default: null
  },
  media: {
    type: [String],
    validate: {
      validator: function (value) {
        return value.length <= 10;
      },
      message: "Media array must not exceed 10 items."
    },
    default: []
  },
  city: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  timezone: {
    type: String,
    default: "Asia/Kolkata"
  },
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  sharesCount: {
    type: Number,
    default: 0
  },
  trendingScore: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  isDeletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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
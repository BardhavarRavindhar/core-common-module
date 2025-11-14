/**
 * @module MediaModel
 * 
 * This module defines the Mongoose schema and model for storing uploaded media.
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";
import { getMediaTypes, getMediaResources, getMediaSizes } from "../enums/media.enum.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Media";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: [],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  */
const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    required: true,
    enum: {
      values: getMediaTypes(),
      message: "{VALUE} is not supported",
    }
  },
  mimeType: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true,
    enum: {
      values: getMediaResources(),
      message: "{VALUE} is not supported",
    }
  },
  caption: {
    type: String,
    default: null
  },
  altText: {
    type: String,
    default: null
  },
  size: {
    type: Number,
    required: true
  },//in bytes
  sizeUnit: {
    type: String,
    default: "BYTE"
  },
  displaySize: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  storage: {
    type: String,
    default: "S3"
  },
  mediaPath: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Create a case-insensitive unique index for the 'filename' field
ModelSchema.index({ filename: 1 }, { unique: true, name: "unique_media_filename" });
// Compound index for efficient filtering of active documents
// Index to improve queries that filter by user
ModelSchema.index({ user: 1 }, { name: "idx_media_owner" });
// Compound index to filter by user and sort by most recent upload
ModelSchema.index({ user: 1, uploadedAt: -1 }, { name: "idx_media_user_uploadedat" });
ModelSchema.index({ user: 1, mediaType: 1, uploadedAt: -1 }, { name: "idx_media_type_uploadedat" });

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
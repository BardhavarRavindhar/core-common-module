/**
 * @module BlockedUserModel
 * 
 * This module defines the Mongoose schema and model for storing block data.
 */

import mongoose, { Model } from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";
import { getCurrentUTC } from "../utils/timer.util.js";

const { Schema, model } = mongoose;
const ModelName = "BlockedUser";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: [],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  */
const BlockSchema = new Schema({
  blocker: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blocked: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockedAt: {
    type: Date,
    default: null
  },
  unblockedAt: {
    type: Date,
    default: null,
  },
  lastBlockedAt: {
    type: Date,
    default: null
  },
  lastUnblockedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: getCurrentUTC()
  }
});

const ModelSchema = new Schema(BlockSchema);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);
// Compound index to prevent duplicate block records
ModelSchema.index({ blocker: 1, blocked: 1 }, { unique: true, name: "unique_user_blocked_pair" });

const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
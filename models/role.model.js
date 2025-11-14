/**
 * @module RoleModel
 * 
 * This module defines the Mongoose schema and model for role.
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";
import { getAllRoles } from "../enums/role.enum.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Role";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: ["title", "name", "info", "abilityActions", "enabled"],
  guarded: [],
  sortKeys: ["id", "name", "enabled"],
  defaultSortKey: "name",
  defaultSortOrder: "asc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  title: {
    type: String,
    required: [true, "Role title is required"],
    trim: true,
    maxlength: [70, "Role title must be no longer than 70 characters"],
  },
  name: {
    type: String,
    required: [true, "Role name is required"],
    maxlength: [20, "Role name must be no longer than 20 characters"],
    uppercase: true,
    immutable: true,
    enum: {
      values: getAllRoles(),
      message: "{VALUE} is not supported",
    },
  }, // define identifier for role
  info: {
    type: String,
    trim: true,
    maxlength: [300, "Role info must be no longer than 300 characters"],
    default: null
  },
  priority: {
    type: Number,
    required: [true, "Role priority is required"],
    min: [0, "Priority value must be at least 0"], // default 0 as high
    validate: {
      validator: Number.isInteger, // Ensure the value is an integer
      message: "Priority value must be an integer",
    }
  }, //Priority manage access level heirarchy. Lower number means higher priority.
  abilityActions: [
    {
      type: String,
      default: [],
    }
  ], // Array of abilitie's action
  forSystem: {
    type: Boolean,
    immutable: true,
    default: false
  }, // Flag to check role for system users or not
  enforceAbility: {
    type: Boolean,
    default: true
  },//Check for abilites or not
  enabled: {
    type: Boolean,
    default: true
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Unique index to enforce name uniqueness
ModelSchema.index({ name: 1 }, { unique: true, name: "unique_role_name" });
// Compound index for efficient filtering of active documents
ModelSchema.index({ enabled: 1, name: 1 }, { name: "idx_role_enabled_name" });

/** @info Define methods related to Schema and Model **/

/**
 * @method buildQuery
 * @info Static method to build query objects based on query params
 * @param {Object<key:value>} params
 */
ModelSchema.statics.buildQuery = async (params) => {
  let query = {};
  query.name = { $ne: "SUPER" };
  return query;
};

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
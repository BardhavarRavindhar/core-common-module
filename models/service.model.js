/**
 * @module ServiceModel
 * 
 * This module defines the Mongoose schema and model for manage platfrom services.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";
import ModelError from "../exceptions/model.error.js";
import logger from "../utils/logger.util.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Service";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: ["id"],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  name: {
    type: String,
    required: [true, "Service name is required"],
    minlength: [2, "Service name must be at least 2 characters long"],
    maxlength: [70, "Service name must be no longer than 70 characters"],
    trim: true,
  }, // define identifier for service
  code: {
    type: String,
    required: [true, "Service unique 10 character code is required"],
    immutable: true,
  },// Unique identifier for service
  icon: {
    type: String,
    default: null,
  }, // Hold svg icon url
  level: {
    type: Number,
    required: [true, "Service level is required"]
  },
  parentService: {
    type: Schema.Types.ObjectId,
    ref: "Service",
    default: null
  },
  taxRebateEligible: {
    type: Boolean,
    default: false,
  },
  hasProfileLeverage: {
    type: Boolean,
    default: false
  },
  forCategory: {
    type: Boolean,
    default: false
  }, //If current service is category or occupation for expertise
  featured: {
    type: Boolean,
    default: false
  },
  info: {
    type: String,
    trim: true,
    default: null,
    maxlength: [70, "Input must be no longer than 70 characers"]
  },
  countExpert: {
    type: Number,
    default: 0
  },
  enabled: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: null
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Define methods and properties related to Schema and Model **/
ModelSchema.statics.limit = 3;

/**
 * @method buildQuery
 * @info Static method to build query objects based on query params
 * @param {Object<key:value>} params
 */
ModelSchema.statics.buildQuery = async (params) => {
  let query = {}, regex;
  query.enabled = true;

  // Search Builder
  if (params.search !== undefined) {
    regex = ModelSchema.statics.getSearchRegex(params.search, 1);
    query.name = { $regex: regex };
  }

  // Featured Builder
  if (params.featured !== undefined && (params.featured === "true" || params.featured === "false")) {
    query.featured = params.featured === "true";
  }

  // Featured Builder
  if (params.parentService !== undefined && ModelSchema.statics.isValidNullorID(params.parentService)) {
    query.parentService = params.parentService;
  }
  return query;
};

ModelSchema.statics.enforceParentService = async function (parentService) {
  let privatePayload = {
    parentService: null,
    level: 0,
    forCategory: true
  }
  /**@info Error Object to throw */
  const error = {
    message: "Invalid parent service id provided",
    code: "UNPROCESSABLE_ENTITY",
    errors: { parentService: parentService }
  };

  /**@case 1: No parent service with level 1 category */
  if (parentService === null) {
    return privatePayload;
  }

  /**@case 2: Invalid parent service with mongo object id */
  if (!this.isValidID(parentService)) {
    throw new ModelError(error);
  }

  /**@case 3: Check parent id exists  */
  const ancestor = await model(ModelName).findById(parentService).exec();
  if (!ancestor) {
    throw new ModelError(error);
  }

  //Set new privatePayload
  const pLevel = ++ancestor.level;
  if (pLevel > 2) {
    throw new ModelError({ message: " Only three category levels are permitted.", code: "BAD_REQUEST" });
  }
  privatePayload = {
    parentService: parentService,
    level: pLevel,
    taxRebateEligible: ancestor.taxRebateEligible,
    hasProfileLeverage: ancestor.hasProfileLeverage,
    forCategory: pLevel !== 2
  };

  return privatePayload;
}


/** @info Apply indexes to support query improvement and avoid conflicts **/
// Unique index to enforce session uniqueness
ModelSchema.index({ code: 1 }, { unique: true, name: "unique_service_code" });
// Compound index for efficient filtering of active documents
ModelSchema.index({ name: 1, level: 1 }, { unique: true, name: "unique_service_name_level", collation: { locale: "en", strength: 2 } });
ModelSchema.index({ parentService: 1, countExpert: 1 }, { name: "idx_parent_expert_meta" });

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
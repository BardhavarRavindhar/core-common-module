/**
 * @module AccountModel
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Account";

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
  aadhaar: {
    client: {
      type: String,
      trim: true,
      default: null
    },
    aadhaarNo: {
      type: String,
      trim: true,
      default: null
    },
    aadhaarDocuments: {
      type: Map,
      of: String,
      default: () => new Map()
    }
  },
  aadhaarVerifiedAt: {
    type: Date,
    default: null
  },
  bankAccount: {
    accountNo: {
      type: String,
      trim: true,
      default: null
    },
    ifsc: {
      type: String,
      uppercase: true,
      trim: true,
      default: null
    },
    accountName: {
      type: String,
      trim: true,
      default: null
    }
  },
  bankAccountVerifiedAt: {
    type: Date,
    default: null
  },
  pan: {
    panNo: {
      type: String,
      uppercase: true,
      trim: true,
      default: null
    }
  },
  panVerifiedAt: {
    type: Date,
    default: null
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Create a case-insensitive unique index for the 'user' field
ModelSchema.index({ user: 1 }, { unique: true, name: "unique_account_profile" });

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
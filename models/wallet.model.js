/**
 * @module WalletModel
 * 
 * This module defines the Mongoose schema and model for user's wallet profile.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Wallet";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: ["id"],
  defaultSortKey: "id",
  defaultSortOrder: "asc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  balance: {
    type: Schema.Types.Decimal128,
    default: Types.Decimal128.fromString("0.00"),
    get: function () {
      const balance = parseFloat(this.depositAmount) + parseFloat(this.payoutAmount);
      return balance.toFixed(2); // Summing two fields
    }
  },
  depositAmount: {
    type: Schema.Types.Decimal128,
    required: true,
    min: Types.Decimal128.fromString("0.00"), // Minimum value for cost
    default: Types.Decimal128.fromString("0.00"),
    set: (cost) => Types.Decimal128.fromString(cost.toString()),
    get: (cost) => parseFloat(cost.toString()).toFixed(2)
  },
  payoutAmount: {
    type: Schema.Types.Decimal128,
    min: Types.Decimal128.fromString("0.00"), // Minimum value for cost
    default: Types.Decimal128.fromString("0.00"),
    set: (cost) => Types.Decimal128.fromString(cost.toString()),
    get: (cost) => parseFloat(cost.toString()).toFixed(2)
  },
  escrowBalance: {
    type: Schema.Types.Decimal128,
    min: Types.Decimal128.fromString("0.00"), // Minimum value for cost
    default: Types.Decimal128.fromString("0.00"),
    set: (cost) => Types.Decimal128.fromString(cost.toString()),
    get: (cost) => parseFloat(cost.toString()).toFixed(2)
  },// Amount hold for taking services
  lifetimeSpending: {
    type: Schema.Types.Decimal128,
    required: true,
    min: Types.Decimal128.fromString("0.00"), // Minimum value for cost
    default: Types.Decimal128.fromString("0.00"),
    set: (cost) => Types.Decimal128.fromString(cost.toString()),
    get: (cost) => parseFloat(cost.toString()).toFixed(2)
  },
  lifetimeRevenue: {
    type: Schema.Types.Decimal128,
    min: Types.Decimal128.fromString("0.00"), // Minimum value for cost
    default: Types.Decimal128.fromString("0.00"),
    set: (cost) => Types.Decimal128.fromString(cost.toString()),
    get: (cost) => parseFloat(cost.toString()).toFixed(2)
  },
  lifetimeRefund: {
    type: Schema.Types.Decimal128,
    min: Types.Decimal128.fromString("0.00"), // Minimum value for cost
    default: Types.Decimal128.fromString("0.00"),
    set: (cost) => Types.Decimal128.fromString(cost.toString()),
    get: (cost) => parseFloat(cost.toString()).toFixed(2)
  },
  lifetimeDeposit: {
    type: Schema.Types.Decimal128,
    min: Types.Decimal128.fromString("0.00"), // Minimum value for cost
    default: Types.Decimal128.fromString("0.00"),
    set: (cost) => Types.Decimal128.fromString(cost.toString()),
    get: (cost) => parseFloat(cost.toString()).toFixed(2)
  },
  lifetimeWithdraw: {
    type: Schema.Types.Decimal128,
    min: Types.Decimal128.fromString("0.00"), // Minimum value for cost
    default: Types.Decimal128.fromString("0.00"),
    set: (cost) => Types.Decimal128.fromString(cost.toString()),
    get: (cost) => parseFloat(cost.toString()).toFixed(2)
  },
  lastPayoutAt: {
    type: Date,
    default: null
  },
  kycCompletedAt: {
    type: Date,
    default: null
  },
  activatedAt: {
    type: Date,
    default: null
  },
  enabled: {
    type: Boolean,
    default: true
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Unique index to enforce profile user uniqueness
ModelSchema.index({ user: 1 }, { unique: true, name: "unique_wallet_owner" });
// Compound index for efficient filtering of active documents
ModelSchema.index({ enabled: 1, user: 1 }, { name: "idx_user_wallet_enabled" });

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
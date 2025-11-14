/**
 * @module RateModel
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";
import ServiceMeta from "../enums/service.enum.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Rate";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const serviceRateSchema = new Schema({
  rateService: {
    type: String,
    lowercase: true,
    enum: ServiceMeta.getRateServices(), // Fixed types
    required: true
  },
  mode: {
    type: String,
    lowercase: true,
    enum: ServiceMeta.getRateModes(), // Fixed types
    default: function () {
      return this.rateService === 'message' ? "chat" : "call";
    }
  },
  unit: {
    type: String,
    required: true,
    lowercase: true,
    enum: ServiceMeta.getRateUnits(), // Fixed units
    default: function () {
      return this.rateService === 'message' ? 'message' : 'minute'
    }
  },
  minDuration: {
    type: Number,
    required: true,
    min: 0,
    default: function () {
      return this.rateService === 'message' ? 1 : 10;
    }
  },
  minDurationCost: {
    type: Schema.Types.Decimal128,
    min: Types.Decimal128.fromString("0.00"), // Minimum value for cost
    default: Types.Decimal128.fromString("0.00"),
    set: (cost) => Types.Decimal128.fromString(cost.toString()),
    get: (cost) => parseFloat(cost.toString()).toFixed(2)
  },
  cost: {
    type: Schema.Types.Decimal128,
    min: Types.Decimal128.fromString("0.00"), // Minimum value for cost
    default: Types.Decimal128.fromString("0.00"),
    set: (cost) => Types.Decimal128.fromString(cost.toString()),
    get: (cost) => parseFloat(cost.toString()).toFixed(2)
  },
  lifetimeAllotedQuota: {
    type: Number,
    min: 0,
    default: 0
  },
  consultations: {
    type: Number,
    min: 0,
    default: 0
  }
}, { _id: false });
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: [],
  defaultSortKey: "user",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rates: {
    type: Map,
    of: serviceRateSchema,
    required: true
  },
  enabledPlan: {
    type: Schema.Types.ObjectId,
    default: null
  },
  enabledTrial: {
    type: Boolean,
    default: false
  },
  enabledGST: {
    type: Boolean,
    default: false
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Define methods related to Schema and Model **/
ModelSchema.trialCall = 2;
ModelSchema.trailChat = 5;

/**
 * @method provideServiceRateMeta
 * @info Static method to build rate service meta data.
 *       - For non-"message" services, if the amount is greater than 0,
 *         the cost is computed as (amount / 10) 
 *       - If the amount is 0, no calculation is performed.
 *
 * @param {string} service - The service type (e.g., "video", "audio", "message").
 * @param {number|string} amount - The integer amount value.
 * @returns {object} An object with rateService, minDurationCost, and cost.
 */
ModelSchema.statics.provideServiceRateMeta = async function (service, amount) {
  let cost = parseInt(amount, 10);
  if (service !== "message") {
    cost = cost > 0 ? Number(cost / 10) : cost;
  }
  const rate = {
    rateService: service,
    minDurationCost: amount,
    cost: cost
  }
  return rate;
};

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Create a case-insensitive unique index for the 'user' field
ModelSchema.index({ user: 1 }, { unique: true, name: "unique_rate_user" });
// Compound index to ensure that a user has only one rate per service type.
ModelSchema.index(
  { user: 1, "rates.rateService": 1 }, { unique: true, name: "unique_rate_user_service" }
);

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
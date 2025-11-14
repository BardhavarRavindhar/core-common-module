/**
 * @module CurrencyModel
 * 
 * This module defines the Mongoose schema and model for currency.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Currency";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: ["name", "code", "symbol", "exchangeRate", "enabled"],
  guarded: ["exchangeRate"],
  sortKeys: ["id", "code", "name", "enabled"],
  defaultSortKey: "code",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const schemaRules = {
  name: {
    type: String,
    required: [true, "Currency name is required"],
    trim: true,
    maxlength: [70, "Currency name must be no longer than 70 characters"],
  },
  code: {
    type: String,
    required: [true, "Currency code is required"],
    uppercase: true,
    minlength: [3, "Currency code must be 3 letter standard ISO code"],
    maxlength: [3, "Currency code must be 3 letter standard ISO code"],
    immutable: true
  },//The ISO 4217 currency code (e.g., USD, EUR)
  symbol: {
    type: String,
    required: [true, "Currency symbol is required"],
    maxlength: 4
  }, // Store currency symbol (e.g., ₹, $)
  exchangeRate: {
    type: Types.Decimal128,
    min: Types.Decimal128.fromString("1.00"), // Minimum value for cost
    default: Types.Decimal128.fromString("1.00"),
    set: (cost) => Types.Decimal128.fromString(cost.toString()),
    get: (cost) => parseFloat(cost.toString()).toFixed(2)
  },//The exchange rate of the currency relative to a base currency
  enabled: {
    type: Boolean,
    default: true
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Unique index to enforce code uniqueness
ModelSchema.index({ code: 1 }, { unique: true, name: "unique_currency_code" });
// Compound index for efficient filtering of active documents
ModelSchema.index({ enabled: 1, code: 1 }, { name: "idx_currency_enabled_code" });

/** @info Define methods related to Schema and Model **/

/**
 * @method buildQuery
 * @info Static method to build query objects based on query params
 * @param {Object<key:value>} params
 */
ModelSchema.statics.buildQuery = async (params) => {
  let query = {};
  query.enabled = true;
  query.code = { $eq: "INR" };
  return query;
};

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
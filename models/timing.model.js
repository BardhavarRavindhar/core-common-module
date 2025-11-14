/**
 * @module TimingModel
 * 
 * This module defines the Mongoose schema and model for expert's call service availability.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";
import Time from "../enums/time.enum.js";
import ModelError from "../exceptions/model.error.js";
import ValidatorError from "../exceptions/validator.error.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Timing";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: ["id"],
  defaultSortKey: "id",
  defaultSortOrder: "asc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const weeklyScheduleSchema = new Schema({
  slotNo: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  }, // "HH:MM"
  endTime: {
    type: String,
    required: true
  }, // "HH:MM"
  startMinutes: {
    type: Number,
    required: true
  },
  endMinutes: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  repeatWeekly: {
    type: Boolean,
    default: true
  },
  enabledInstantMode: {
    type: Boolean,
    default: false
  }
}, { _id: false });
const slotSchema = new Schema({
  slotNo: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  }, // "HH:MM"
  endTime: {
    type: String,
    required: true
  }, // "HH:MM"
  days: [{
    type: String,
    enum: Time.getWeekDays(),
    required: true
  }],
  repeatWeekly: {
    type: Boolean,
    default: true
  },
  enabledInstantMode: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  timings: [slotSchema],
  weeklySchedule: {
    type: Map,
    of: [weeklyScheduleSchema],
    required: true
  },
  activeBookings: [{
    type: Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  }]
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/

/** @info Define methods and properties related to Schema and Model **/
ModelSchema.statics.parseSlotTime = async (startTime, endTime) => {
  // Convert times to minutes
  const startMinutes = Time.provideMinsFromTime(startTime);
  const endMinutes = Time.provideMinsFromTime(endTime);
  const duration = endMinutes - startMinutes;

  if (duration < 0) {
    throw new ValidatorError({ errors: { "endTime": "endTime must be greater than startTime" } });
  }

  if (duration < 10) {
    throw new ValidatorError({ errors: { "endTime": "endTime must be at least 10 minutes after startTime" } });
  }
  return {
    startMinutes,
    endMinutes,
    duration
  }
};

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
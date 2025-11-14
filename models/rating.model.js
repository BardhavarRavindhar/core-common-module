/**
 * @module ReviewModel
 *
 * This module defines the Mongoose schema and model for review relationships.
 * It supports two types of reviews:
 * 1. Client rating ("client") – provided by an expert based on call session behavior.
 * 2. Expert rating ("expert") – provided by a client based on service experience.
 */
import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";
import { getLocalCalenderAgo } from "../utils/timer.util.js";
import { getCurrentUTC } from "../utils/timer.util.js";

const { Schema, model } = mongoose;
const ModelName = "Rating";

/** @info Defines schema options for {SchemaComposePlugin} **/
const schemaOptions = {
  fillables: [],
  guarded: [],
  sortKeys: ["id"],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

/** @info Defines the structure and validation rules for the review document **/
const schemaRules = {
  // The user who writes the review (can be an expert or client)
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // The user being reviewed (Either client or expert)
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Reference to the booking/call session (e.g., required when an expert rates a client and vice-versa)
  booking: {
    type: Schema.Types.ObjectId,
    ref: "Booking",
    default: null
  },
  // Rating value must be between 0.5 and 5.0 and in multiples of 0.5
  rating: {
    type: Number,
    required: true,
    min: 0.5,
    max: 5.0,
    validate: {
      validator: function (v) {
        return (v * 2) % 1 === 0;
      },
      message: props => `${props.value} is not a valid rating. It should be a multiple of 0.5.`
    }
  },
  // Text review
  review: {
    type: String,
    required: true
  },
  reviewType: {
    type: String,
    uppercase: true,
    enum: ["CLIENT", "EXPERT"],
    required: true
  },
  // Date when the review was created; uses a getter for localized formatting
  reviewAt: {
    type: Date,
    default: getCurrentUTC(),
    get: function (isodate) {
      if (isodate) {
        return getLocalCalenderAgo(isodate);
      }
      return isodate;
    }
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info Apply plugins to extend schema functionality **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Create unique index to prevent duplicate review relationships.
 * This index ensures that for a given booking, reviewer, reviewee, and reviewType,
 * there is only one review entry.
 **/
ModelSchema.index({ booking: 1, reviewer: 1, user: 1, reviewType: 1 }, { unique: true, name: "unique_booking_rating" });

/** @info Index to optimize queries for reviews of a specific user (e.g., listing client ratings for an expert) **/
ModelSchema.index({ user: 1, reviewType: 1 }, { name: "idx_user_review" });

const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;

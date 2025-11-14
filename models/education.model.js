/**
 * @module MediaModel
 * 
 * This module defines the Mongoose schema and model for storing user educations.
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";

const { Schema, model, Types } = mongoose;
const ModelName = "Education";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: ["educations"],
  guarded: [],
  sortKeys: ["educations.startDate"],
  defaultSortKey: "educations.startDate",
  defaultSortOrder: "desc",
  sortOptions: {
    "educations.startDate": {
      type: "date",
      order: "desc"
    }
  }
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  */
const educationEntrySchema = new Schema({
  recordNo: {
    type: String,
    required: true,
    unique: true
  },
  institution: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, "Institute name must be no longer than 100 characers"],
  }, //School or College
  degree: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, "Degree name must be no longer than 100 characers"],
  },
  major: {
    type: String,
    trim: true,
    default: null
  },// define field of study
  certificate: {
    type: String,
    default: null
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null
  }
}, { _id: false });

const schemaRules = {
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  educations: {
    type: [educationEntrySchema],
    default: []
  }
};
const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/**
 * @method isEducationDuplicate
 * Checks whether an education entry already exists for a user based on institution and degree.
 * @param {ObjectId} userId - The ID of the user.
 * @param {Object} educationData - The education data to check.
 * @param {string} educationData.institution - The institution name.
 * @param {string} educationData.degree - The degree name.
 * @param {string} [excludeRecordNo] - A record number to exclude from the duplicate check (optional).
 * @returns {Promise<boolean>} - Returns true if a duplicate exists, false otherwise.
 */
ModelSchema.statics.isEducationDuplicate = async function (owner, educationData, excludeRecordNo = null) {
  const { institution, degree } = educationData;

  const query = {
    user: owner,
    educations: {
      $elemMatch: {
        institution: { $regex: new RegExp(`^${institution}$`, 'i') },
        degree: { $regex: new RegExp(`^${degree}$`, 'i') }
      }
    }
  };

  if (excludeRecordNo) {
    query.educations.$elemMatch.recordNo = { $ne: excludeRecordNo };
  }

  const duplicateEntry = await this.findOne(query);
  return Boolean(duplicateEntry);
};
/** @info Apply indexes to support query improvement and avoid conflicts **/
// Create a case-insensitive unique index for the 'user' field
ModelSchema.index({ user: 1 }, { unique: true, name: "unique_education_profile" });
ModelSchema.index({ "educations.recordNo": 1 }, { unique: true, name: "unique_education_record" });
ModelSchema.index({ user: 1, "educations.institution": 1, "educations.degree": 1 },
  { unique: true, name: "unique_institution_degree", collation: { locale: "en", strength: 2 } }
);

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;
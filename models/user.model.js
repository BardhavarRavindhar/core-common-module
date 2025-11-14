/**
 * @module UserModel
 * 
 * This module defines the Mongoose schema and model for user.
 * 
 */

import mongoose from "mongoose";
import SchemaComposePlugin from "./plugins/schema-composer.plugin.js";
import { getAllRoles } from "../enums/role.enum.js";
import { getAccountStates } from "../enums/account-state.enum.js";

const { Schema, model, Types } = mongoose;
const ModelName = "User";

/** @info  Defines schema options for {SchemaComposePlugin}  **/
const schemaOptions = {
  fillables: ["displayName", "photo", "roleName", "provinceCode", "countryCode", "location"],
  guarded: ["profileInterest", "profileExpertService"],
  sortKeys: ["id"],
  defaultSortKey: "id",
  defaultSortOrder: "desc"
};

/** @info  Defines the structure and validation rules for the active document in MongoDB  **/
const socialSchema = new Schema({
  social: {
    type: Schema.Types.ObjectId,
    ref: 'Social',
    required: true
  },
  profileUrl: {
    type: String,
    required: true
  }
}, { _id: false });
const schemaRules = {
  roleName: {
    type: String,
    required: true,
    uppercase: true,
    enum: {
      values: getAllRoles(),
      message: "{VALUE} is not supported"
    }
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [100, "Input must be no longer than 100 characters"],
    default: null
  },
  photo: {
    type: String,
    default: null
  },
  username: {
    type: String,
    trim: true,
    lowercase: true,
    required: true,
    maxlength: [70, "Username must be no longer than 70 characters"]
  },
  phone: {
    type: String,
    trim: true,
    required: true,
    minlength: [10, "Phone must be atleast 10 characters"],
    maxlength: [10, "Phone must be no longer than 10 characters"]
  }, // Primary field for account verification by otp
  phoneVerifiedAt: {
    type: Date,
    default: null
  }, // When user account first time verified by otp
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: null,
    maxlength: [254, "Email must be no longer than 254 characters"]
  },
  emailVerifiedAt: {
    type: Date,
    default: null
  },
  languages: [{
    type: String,
    lowercase: true,    // Recommended for consistency
    trim: true,
    minlength: [2, "Language code must be atleast 2 letter ISO code"],
    maxlength: [6, "Language code must be no longer than 6 letter ISO code"],
  }], // Handle spoken languages by 2 letter iso codes
  provinceCode: {
    type: String,
    uppercase: true,
    minlength: [2, "State code must be 2 letter ISO state code"],
    maxlength: [2, "State code must be 2 letter ISO state code"],
    default: null
  },
  countryCode: {
    type: String,
    uppercase: true,
    minlength: [3, "Country code must be 3 letter ISO country code"],
    maxlength: [3, "Country code must be 3 letter ISO country code"],
    default: null
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point", // Default type for the geospatial field
    },
    coordinates: {
      type: [Number],
      default: [0, 0], // Default coordinates: [longitude, latitude]
    }
  },
  timezone: {
    type: String,
    default: "Asia/Kolkata"
  },
  callingCode: {
    type: String,
    default: "+91"
  },
  status: {
    type: String,
    trim: true,
    uppercase: true,
    enum: {
      values: getAccountStates(),
      message: "{VALUE} is not supported",
    }
  },
  statusNote: {
    type: String,
    trim: true,
    default: null
  },
  socials: {
    type: [socialSchema],
    default: []
  }, // Socials like facebook, twitter etc
  socialAccounts: {
    type: Map,
    of: String,
    default: () => new Map(), // Default to an empty Map
  }, // Registered SSO Accounts
  sessions: {
    type: Map,
    of: String,
    default: () => new Map(), // Default to an empty Map
  },// Store <device:deviceAgent>  
  online: {
    type: Boolean,
    default: false
  }, // For online status
  forSystem: {
    type: Boolean,
    default: false
  }, // Flag to set user for system or not
  profile: {
    type: Schema.Types.ObjectId,
    ref: "Profile",
    default: null
  }, // handle external bio
  wallet: {
    type: Schema.Types.ObjectId,
    ref: "Wallet",
    default: null
  },
  profileEducation: {
    type: Schema.Types.ObjectId,
    ref: "Education",
    default: null
  },
  profileExperience: {
    type: Schema.Types.ObjectId,
    ref: "Experience",
    default: null
  },
  profileAchievement: {
    type: Schema.Types.ObjectId,
    ref: "Achievement",
    default: null
  },
  profileInterest: {
    type: Schema.Types.ObjectId,
    ref: "Passion",
    default: null
  },
  profileAccount: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    default: null
  },//Hold KYC related profile
  profileExpertise: {
    type: Schema.Types.ObjectId,
    ref: "Proficiency",
    default: null
  },
  profileExpertService: {
    type: Schema.Types.ObjectId,
    ref: "Consultation",
    default: null
  },
  profileExpertRate: {
    type: Schema.Types.ObjectId,
    ref: "Rate",
    default: null
  },
  profileExpertTiming: {
    type: Schema.Types.ObjectId,
    ref: "Timing",
    default: null
  },
  profileSetting: {
    type: Schema.Types.ObjectId,
    ref: "Setting",
    default: null
  },
  topRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }, //manage profile avg rating
  trendingScore: {
    type: Number,
    min: 0,
    max: 100, // score is typically between 0 and 100 calculated on weight scores
    default: 0
  }, //manage trending list
  trendingScoreAt: {
    type: Date,
    default: null
  },//When updated score
  expertProfileAt: {
    type: Date,
    default: null
  },//When approved
  expertEnrolledAt: {
    type: Date,
    default: null
  },
  registerAt: {
    type: Date,
    default: Date.now
  },
  registerBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  }
};

const ModelSchema = new Schema(schemaRules);

/** @info  Apply plugins to active schema to extend features **/
ModelSchema.plugin(SchemaComposePlugin, schemaOptions);

/** @info Apply indexes to support query improvement and avoid conflicts **/
// Set primary key unique
ModelSchema.index({ phone: 1 }, { unique: true, name: "unique_user_phone" });
ModelSchema.index({ username: 1 }, { unique: true, name: "unique_username" });
// Enforce a unique index for SUPERADMIN
ModelSchema.index({ roleName: 1 }, { unique: true, name: "unique_superadmin", partialFilterExpression: { roleName: "SUPER" } });
// Add unique index that not consider null as value for unique
ModelSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } }, name: "unique_email" });
// Add a geospatial index for location
ModelSchema.index({ location: "2dsphere" }, { name: "idx_location_2dsphere" });
// Compound index for frequently queried fields
ModelSchema.index({ forSystem: 1, deletedAt: 1 }, { name: "idx_user_system_deleted" });


/** @info Define virtual relation created with custom field not by id **/
ModelSchema.virtual('spokenLanguages', {
  ref: 'Language',
  localField: 'languages',
  foreignField: 'code',
  justOne: false // Set to false since languages is an array
});
// Virtual that returns an array of account types.
ModelSchema.virtual('type').get(function () {
  const types = [];
  // Base type based on forSystem flag.
  types.push(this.forSystem ? 'USER' : 'CLIENT');
  // If expertEnrolledAt is set, add 'expert'
  if (this.expertEnrolledAt) {
    types.push('EXPERT');
  }
  return types;
});

/** @info : Apply transformation logic to Model methods for better maintainability **/
const jsonOption = {
  virtuals: true,
  getters: true,
  versionKey: false,
  transform: (doc, { _id, ...ret }) => {
    // Rename _id to id
    ret.id = _id;

    // Social Data
    if (Array.isArray(ret.socials) && ret.socials.length > 0) {
      ret.socials = ret.socials.map(({ social, profileUrl }) => ({
        _id: social?._id ?? social?.id,
        name: social?.name ?? null,
        icon: social?.icon ?? null,
        profileUrl
      }));
    } else {
      ret.socials = [];
    }

    // Profile  Interests
    if (ret.profileInterest !== null && ret.profileInterest?.interests) {
      ret.interests = ret.profileInterest.interests;
    } else {
      ret.interests = [];
    }

    // Profile  ExpertService as Consultation
    if (ret.profileExpertService !== null) {
      ret.consultation = ret.profileExpertService;
    } else {
      ret.consultation = null;
    }

    // Profile  ExpertRates
    if (ret.profileExpertRate !== null) {
      ret.pricing = ret.profileExpertRate;
    } else {
      ret.pricing = null;
    }

    // Mapping for profile fields: key is the source field and value is the target output field.
    const profileFieldsMapping = {
      profileEducation: 'educations',
      profileExperience: 'experiences',
      profileAchievement: 'achievements',
      profileExpertise: 'expertises',
      profileExpertRate: 'rates',
      profileExpertTiming: 'timings'
    };

    // Loop through each profile field and transform the data.
    Object.entries(profileFieldsMapping).forEach(([source, target]) => {
      ret[target] = ret[source]?.[target] || [];
      delete ret[source];
    });

    // Remove guarded fields during transformation
    const { guarded } = ModelSchema.statics;
    if (Array.isArray(guarded) && guarded.length) {
      guarded.forEach((field) => delete ret[field]);
    }
    return ret;
  },
}// end toJSON transformation
ModelSchema.set("toObject", jsonOption);
ModelSchema.set("toJSON", jsonOption);

/** @info Define methods related to Schema and Model **/

/**
 * @method buildQuery
 * @platform PANEL
 * @info Static method to build query objects based on query params
 * @param {Object<key:value>} params
 */
ModelSchema.statics.buildQuery = async (params) => {
  let query = {};
  return query;
};

/**
 * @method buildUserQuery
 * @platform APP <OR> WEB
 * @info Static method to build query objects based on query params to retrieve app users
 * @param {Object<key:value>} params
 * @param {ObjectId} authUser
 */
ModelSchema.statics.buildUserQuery = async (params, authUser = null) => {
  let query = {};
  // Apply forSystem filter to exclude system users
  query.forSystem = false;
  // Apply filter to exclude active user from list
  if (authUser !== null) {
    query._id = { $ne: authUser };
  }
  return query;
}

/**
 * @method buildExpertQuery
 * @platform APP <OR> WEB
 * @info Static method to build query objects based on query params to retrieve app users
 * @param {Object<key:value>} params
 * @param {ObjectId} authUser
 */
ModelSchema.statics.buildExpertQuery = async (params, authUser = null) => {
  let query = {};
  // Apply forSystem filter to exclude system users
  query.forSystem = false;
  // Apply filter to exclude active user from list
  if (authUser !== null) {
    query._id = { $ne: authUser };
  }
  // Apply filter to include users who have expert profile enabled
  query.approvedExpertProfileAt = { $ne: null, $exists: true };
  return query;
}

// In your base model or schema plugin
ModelSchema.statics.manageSearchPayload = async function(filterQuery, params, populates = []) {
  // 1. Get total count
  const total = await this.countDocuments(filterQuery);
  
  // 2. Apply pagination
  const limit = parseInt(params.limit) || 10;
  const skip = parseInt(params.skip) || 0;
  const page = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  // 3. Apply sorting
  const sort = {};
  if (params.sortKey) {
    sort[params.sortKey] = params.sortOrder === 'desc' ? -1 : 1;
  }

  // 4. Execute query with pagination and sorting
  let query = this.find(filterQuery)
    .skip(skip)
    .limit(limit)
    .sort(sort);

  // 5. Apply population if needed
  if (populates && populates.length > 0) {
    populates.forEach(populate => {
      query = query.populate(populate);
    });
  }

  // 6. Execute query
  const data = await query.lean().exec();

  // 7. Return standardized response
  return {
    data,
    metadata: {
      count: total,
      query: params,
      pagination: {
        limit,
        skip,
        page,
        totalPages
      },
      sorting: {
        sortKey: params.sortKey,
        sortOrder: params.sortOrder
      }
    }
  };
};

/** @info Create active schema model and export **/
const ActiveModel = model(ModelName, ModelSchema);

export default ActiveModel;

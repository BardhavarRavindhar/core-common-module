/**
 * @module SchemaComposePlugin
 * 
 * A plugin to share common methods & properties for models and enforce hooks to avoid conflicts.
 * 
 */

import mongoose from "mongoose";
import ModelError from "../../exceptions/model.error.js";
import escapeRegExp from "../../utils/escape-regex.util.js";
import transformModelError from "../../transformers/model-error.transformer.js";

const { Schema, Types, startSession } = mongoose;

/**
 * Mongoose plugin to add common properties and methods to a schema
 * @param {mongoose.Schema} ModelSchema - The Mongoose schema
 * @param {Object} Options - Options for the schema
 */
const SchemaComposePlugin = (ModelSchema, Options = {}) => {
  // Automatically run validators on update queries
  function setRunValidators() {
    this.setOptions({ runValidators: true, new: true });
  }

  // Apply runValidators hooks to update operations
  ModelSchema.pre('update', setRunValidators);
  ModelSchema.pre('updateOne', setRunValidators);
  ModelSchema.pre('updateMany', setRunValidators);
  ModelSchema.pre('findOneAndUpdate', setRunValidators);
  ModelSchema.pre('findOneAndReplace', setRunValidators);

  const schemaMethods = ['save', 'update', 'updateOne', 'updateMany', 'findOneAndUpdate'];
  schemaMethods.forEach(method => {
    ModelSchema.post(method, function (error, res, next) {
      error = transformModelError(error);
      return next(error);
    });
  });

  /** @info : Define Model common Schema static properties **/
  const { fillables = [], guarded = [], sortKeys = [], defaultSortKey = "_id", defaultSortOrder = "desc" } = Options;
  ModelSchema.statics.fillables = Array.isArray(fillables) ? fillables : [];
  ModelSchema.statics.guarded = Array.isArray(guarded) ? guarded : [];
  ModelSchema.statics.sortKeys = Array.isArray(sortKeys) ? sortKeys : [];
  ModelSchema.statics.defaultSortKey = typeof defaultSortKey === "string" ? defaultSortKey : "_id";
  ModelSchema.statics.defaultSortOrder = typeof defaultSortOrder === "string" && defaultSortOrder === "desc" ? defaultSortOrder : "asc";

  /** @info : Define Model static properties for manage collection query response with search metadata **/
  ModelSchema.statics.filterQuery = {};
  ModelSchema.statics.searchPayload = { data: [], metadata: { count: 0, query: {}, sorting: {}, pagination: {} } };

  /** @info : Apply transformation logic to Model methods for better maintainability **/
  const jsonOption = {
    virtuals: true,
    getters: true,
    versionKey: false,
    transform: (doc, { _id, ...ret }) => {
      // Rename _id to id
      ret.id = _id;

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
  /** @info : Define custom Model methods for reusability across all schema and models **/
  /**
   * @method provideObjectID
   * Provide unique MongoDB ObjectId
   */
  ModelSchema.statics.provideObjectID = () => {
    const record = new Types.ObjectId();
    return record.toString();
  };// end fn {provideObjectID}

  /**
  * @method provideDocID
  * Provide  MongoDB ObjectId to string format or null
  */
  ModelSchema.statics.provideDocID = (doc, inside = true) => {
    const record = inside ? doc[0] : doc;
    const id = record ? record._id.toString() : null;
    return id;
  };// end fn {provideObjectID}

  /**
   * @method isValidID
   * Check if a given ID is a valid MongoDB ObjectId
   * @param {String} id - input ID to validate
   * @returns {Boolean} - True if the ID is a valid ObjectId, false otherwise
   */
  ModelSchema.statics.isValidID = (id) => {
    return !!Types.ObjectId.isValid(id);
  };// end fn {isValidID}

  /**
   * @method isValidNullorID
   * Check if a value is a valid Mongoose ObjectId or null
   * @param {string|null} value - The value to check
   * @returns {boolean} - True if the value is a valid ObjectId or null, false otherwise
   */
  ModelSchema.statics.isValidNullorID = (value) => {
    return value === null || Types.ObjectId.isValid(value);
  };// end fn {isValidNullorID}

  /**
  * @method initTransactionSession
  * Provide a new Mongoose transaction session to be used for atomic operations
  */
  ModelSchema.statics.initTransactionSession = async () => {
    return await startSession();
  };// end fn {initTransactionSession}

  /**
   * @method paginate
   * Paginates the query results based on the provided query parameters
   * @param {Object} params - Query parameters for pagination
   * @returns {Object} - The paginated query object
   */
  ModelSchema.query.paginate = function (params, count) {

    const DEFAULT_LIMIT = 10; // Default documents per page
    const DEFAULT_MAX_LIMIT = 50; // Maximum allowed documents per page
    const DEFAULT_PAGE = 1; // Default page number

    // Ensure params is always an object
    if (typeof params !== "object" || params === null) {
      params = {};
    }

    // Initialize pagination parameters
    let { limit = DEFAULT_LIMIT, page = DEFAULT_PAGE } = params;
    limit = parseInt(limit, 10);
    page = parseInt(page, 10);
    // Parse and validate input parameters
    limit = Number.isInteger(limit) ? Math.max(limit, 1) : DEFAULT_LIMIT; // Ensure limit is positive
    limit = Math.min(limit, DEFAULT_MAX_LIMIT); // Enforce max limit
    page = Number.isInteger(page) ? Math.max(page, 1) : DEFAULT_PAGE; // Ensure page is positive and min 1

    //  Calculate other pagination parameters
    const skip = (page - 1) * limit; // Calculate skip value
    const total = count < limit ? 1 : Math.ceil(count / limit);

    // Add pagination metadata
    this.schema.statics.searchPayload.metadata.pagination.limit = limit;
    this.schema.statics.searchPayload.metadata.pagination.skip = skip;
    this.schema.statics.searchPayload.metadata.pagination.page = page;
    this.schema.statics.searchPayload.metadata.pagination.totalPages = total;

    return this.limit(limit).skip(skip);
  }; // end fn {paginate}

  /**
  * @method sortBy
  * Sorts the query results based on the provided query parameters
  * @param {Object} params - Query parameters for sorting
  * @returns {Object} - The sort query object
  */
  ModelSchema.query.sortBy = function (params) {

    // Ensure params is an object
    if (typeof params !== "object" || params === null) { params = {}; }
    // Get default sort key and order from schema
    const { defaultSortKey, defaultSortOrder, sortKeys } = this.schema.statics;
    // Convert sortKeys to a Set for faster lookups
    const sortColumns = new Set(sortKeys);
    // Initialize sort key and order
    let { sortKey = defaultSortKey, sortOrder = defaultSortOrder } = params;

    // Initialize & Build sort query
    const sortQuery = {};
    sortKey = sortColumns.has(sortKey) ? sortKey : defaultSortKey;
    if (sortKey === "id") { sortKey = "_id"; }
    sortOrder = sortOrder === "asc" ? sortOrder : defaultSortOrder;
    sortQuery[sortKey] = sortOrder;

    // Add sorting metadata
    this.schema.statics.searchPayload.metadata.sorting.sortKey = sortKey;
    this.schema.statics.searchPayload.metadata.sorting.sortOrder = sortOrder;

    //Apply sort method of mongoose using chaining
    return this.sort(sortQuery);
  }; // end fn {sortBy}

  /**
 * @method enforceOnlyFillables
 * Ensures only fillable properties are retained from the request payload.
 * Helps prevent unwanted schema conflicts and enforces data integrity.
 * 
 * @param {Object} payload - Request body containing data to filter.
 * @param {Object} [privatePayload={}] - Additional private data to merge.
 * @returns {Object} - Object containing only the allowed fillable properties.
 */
  ModelSchema.statics.enforceOnlyFillables = function (payload = {}, privateMeta = {}) {

    if (typeof payload !== "object" || payload === null) {
      throw new ModelError({
        message: "Invalid payload. Expected an object.",
        code: "BAD_REQUEST",
        forClient: true
      });
    }

    const fillables = this.fillables.reduce((filtered, key) => {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        filtered[key] = payload[key];
      }
      return filtered;
    }, {});

    return { ...fillables, ...privateMeta };
  };// end fn {enforceOnlyFillables}

  /**
 * @method manageSearchPayload
 * Handles collection query payload with search metadata, sorting, pagination, and optional relation filtering.
 *
 * @param {Object} filters - Filters for querying documents.
 * @param {Object} params - Query parameters for sorting and pagination.
 * @param {Array} populates - Array of population configurations (relations).
 * @returns {Object} - The updated search payload with data and metadata.
 */
  ModelSchema.statics.manageSearchPayload = async function (filters = {}, params = {}, populates = []) {
    // Count total documents for pagination metadata
    const count = await this.countDocuments(filters).lean().exec();

    // Build base query
    const query = this.find(filters);

    // Apply sorting and pagination
    query.sortBy(params);
    query.paginate(params, count);

    // Handle population of related fields
    if (Array.isArray(populates) && populates.length > 0) {
      populates.forEach((relation) => {
        query.populate(relation);
      });
    }

    // Execute query and build response payload
    this.searchPayload.data = await query.exec();
    this.searchPayload.metadata.count = count;
    return this.searchPayload;
  }// end fn {manageSearchPayload}

  /**
   * @method getSearchRegex
   * Generates a case-insensitive regex pattern with sanitized input based on the given search type.
   * @param {string} search - The search term to generate a regex pattern for.
   * @param {number} [type=1] - The pattern type:
   *   1 = Starts with the search term
   *   2 = Ends with the search term
   *   3 = Contains the search term anywhere
   * @returns {RegExp} - The generated regex pattern.
   */
  ModelSchema.statics.getSearchRegex = (search, type = 3) => {
    const patterns = {
      1: `^${escapeRegExp(search)}`,  // Start with
      2: `${escapeRegExp(search)}$`,  // End with
      3: `${escapeRegExp(search)}`,   // Anywhere in the string
    };
    if (!patterns[type]) {
      throw new ModelError({ message: "Invalid regex pattern type provided.", forClient: false });
    }
    return new RegExp(patterns[type], "i"); // Case-insensitive regex
  }

};// end plugin
export default SchemaComposePlugin;
/**
 * @module Validator
 * 
 * This module provides utility functions for validating data.
 * It includes functions to validate various types of data such as strings, numbers, and objects.
 */

import { Types } from "mongoose";
import fv from "fastest-validator";
import { hasAllowedDateFormat, validateDatesInterval } from "./timer.util.js";
import Time from "../enums/time.enum.js";

// Create a new instance of the fastest-validator
const v = new fv({
  useNewCustomCheckerFunction: true,
  messages: {
    required: "{field} can't be blank.",
    string: "{field} must be valid text.",
    number: "{field} must be a valid number.",
    object: "{field} must be a valid object.",
    array: "{field} must be a valid array.",
    boolean: "{field} must be either true or false.",
    date: "{field} must be a valid date.",
    email: "{field} must be a valid email address.",
    url: "{field} must be a valid URL.",
    enum: "{field} must be one of the following: {values}.",
    equal: "{field} must be exactly '{value}'.",
    notEqual: "{field} must not be '{value}'.",
    min: "{field} must be at least {expected}.",
    max: "{field} must be at most {expected}.",
    length: "{field} must be exactly {expected} characters long.",
    minLength: "{field} must be at least {expected} characters long.",
    maxLength: "{field} must be at most {expected} characters long."
  },
});

// Define custom validator as alias
/**  contact  : Define a custom validator for phone numbers in application. **/
v.alias("contact", {
  type: "string",
  pattern: /^[0-9]{10}$/, // Ensures exactly 10 digits
  messages: {
    stringPattern: "{field} must be exactly 10 digits and a valid number."
  },
});

/**  mongoID  : Define a custom validator for mongo document id. **/
v.alias("mongoID", {
  type: "string",
  custom: (value, errors, schema, field) => {
    if (value && !Types.ObjectId.isValid(value)) {
      errors.push({ type: "string", field: `${field}`, actual: value, message: "{field} must be a valid Object id." });
    }
    return value;
  },
});

/**  mongoID  : Define a custom validator for mongo document id. **/
v.alias("platformDateString", {
  type: "string",
  custom: (value, errors, schema, field, name, parent) => {

    /** @case1 : Value optional **/
    if (!value && schema.optional === true) { return value; }

    /** @case2 : Value required **/
    if (!value) {
      errors.push({ type: "required", field: `${field}`, message: `${field} field can't be black.` });
      return value;
    }

    /** @case3 : Validate date string format **/
    const valid = hasAllowedDateFormat(value);
    if (!valid) {
      errors.push({ type: "string", field: `${field}`, actual: value, message: `{field} must be a valid date string with format ${Time.dateFormat}.` });
      return value;
    }

    /** @case4 : Validate endDate and startDate **/
    if (schema.enforceEarlier !== undefined) {
      if (parent.data !== undefined) {
        const earlierDate = parent.data[schema.enforceEarlier];
        if (earlierDate !== undefined) {
          const validInterval = validateDatesInterval(earlierDate, value);
          if (!validInterval) {
            errors.push({ type: "string", field: `${field}`, actual: value, message: `{field} must not be earlier than ${schema.enforceEarlier} provided.` });
            return value;
          }
        }
      }
      return value;
    }
    return value;
  }
});

/**  socialMedia  : Define a custom validator for socialMedia account links. **/
v.alias("socialMedia", {
  type: "object",
  strict: true,
  minProps: 1, // At least one social media handle is required if the object is provided
  messages: {
    objectMinProps: "{field} must have at least one social media handle.", // Custom message
  },
  custom: (value, errors, schema, field) => {
    if (typeof value !== "object") {
      return value;
    }
    for (const key in value) {
      if (!Types.ObjectId.isValid(key)) {
        errors.push({ type: "string", field: `${field}.${key}`, actual: key, message: `${key} key must be a mongo object id.` });
      }
      const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-]*)*(\?[a-zA-Z0-9&%=]*)?(#[\w-]*)?$/;
      if (!urlRegex.test(value[key])) {
        errors.push({ type: "url", field: `${field}.${key}`, actual: value[key], message: `${key} must be a valid URL.` });
      }
    }
    return value;
  }
});


v.alias('datetimeTZ', {
  type: 'string',
  custom(value, schema, fieldPath, parent, errors) {
      if (typeof value !== 'string') {
          errors.push({ type: 'datetime', field: fieldPath, actual: value });
          return;
      }

      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?([+-]\d{2}:\d{2}|Z)$/;
      if (!isoPattern.test(value)) {
          errors.push({ type: 'datetime', field: fieldPath, actual: value });
          return;
      }

      const date = new Date(value);
      if (isNaN(date.getTime())) {
          errors.push({ type: 'datetime', field: fieldPath, actual: value });
      }
      return value;
  },
  messages: {
      datetime: 'The "{field}" must be a valid ISO 8601 datetime string with timezone.'
  }
});

/**
 * Transform validation errors into a payload object with field:error pair
 * @param {Array} errors - Array of validation errors
 */
function transformErrorPayload(errors) {
  return errors.reduce((payload, error) => {
    payload[error.field] = error.message;
    return payload;
  }, {});
}

/**
 * Validates data against a set of rules.
 * @param {Object} rules - The validation rules.
 * @param {Object} payload - The data to validate.
 * @returns {Object|undefined} - Returns an object with validation errors or undefined if validation passed.
 */
export const Validator = (rules, payload) => {
  const schemaValidator = v.compile(rules); // Compile the schema
  const errors = schemaValidator(payload); // Validate the inputs

  // If validation fails, return formatted errors
  if (errors !== true) {
    return transformErrorPayload(errors);
  }
  return undefined; // Validation passed
}
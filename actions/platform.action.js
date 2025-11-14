/**
 * @module PlatformAction
 * 
 * This module defines methods to handle resources like Country, Currency, Province etc.
 */
import CurrencyModel from "../models/currency.model.js";
import CountryModel from "../models/country.model.js";
import ProvinceModel from "../models/province.model.js";
import LanguageModel from "../models/language.model.js";
import SocialModel from "../models/social.model.js";
import InterestModel from "../models/interest.model.js";
import ExpertiseModel from "../models/expertise.model.js";
import ServiceModel from "../models/service.model.js";
import ModelError from "../exceptions/model.error.js";
import ValidatorError from "../exceptions/validator.error.js";

/**
 * @method  createCurrency
 * Create a new currency.
 * @param {object} payload - Data for the new currency.
 */
export const createCurrency = async (payload) => {
  const modelSchema = payload;
  const record = await CurrencyModel.create(modelSchema);
  return record;
}// end fn {createCurrency}

/**
 * @method  getCurrencies
 * Get currencies based on provided parameters.
 * @param {object} params - The query parameters for filtering currencies.
 * @returns {Promise<object[]>} - The collection of currencies.
 */
export const getCurrencies = async (params) => {
  // Build filter query based on query params
  const filterQuery = await CurrencyModel.buildQuery(params);
  //Define populate schemas
  const populates = [];
  // On collection, apply filter query with sorting and pagination based on params. Also define schema to populates
  const collection = await CurrencyModel.manageSearchPayload(filterQuery, params, populates);
  return collection;
}// end fn {getCurrencies}

/**
 * @method  createCountry
 * Create a new country.
 * @param {object} payload - Data for the new country.
 */
export const createCountry = async (payload) => {
  const modelSchema = payload;
  const record = await CountryModel.create(modelSchema);
  return record;
}// end fn {createCountry}

/**
 * @method  getCountries
 * Get countries based on provided parameters.
 * @param {object} params - The query parameters for filtering countries.
 * @returns {Promise<object[]>} - The collection of countries.
 */
export const getCountries = async (params) => {
  // Build filter query based on query params
  const filterQuery = await CountryModel.buildQuery(params);
  //Define populate schemas
  const populates = [];
  // On collection, apply filter query with sorting and pagination based on params. Also define schema to populates
  const collection = await CountryModel.manageSearchPayload(filterQuery, params, populates);
  return collection;
}// end fn {getCountries}

/**
 * @method  createProvince
 * Create a new province.
 * @param {object} payload - Data for the new province.
 */
export const createProvince = async (payload) => {
  const modelSchema = payload;
  const record = await ProvinceModel.create(modelSchema);
  return record;
}// end fn {createProvince}

/**
 * @method  getProvinces
 * Get provinces based on provided parameters.
 * @param {object} params - The query parameters for filtering provinces.
 * @returns {Promise<object[]>} - The collection of provinces.
 */
export const getProvinces = async (params) => {
  // Build filter query based on query params
  const filterQuery = await ProvinceModel.buildQuery(params);
  //Define populate schemas
  const populates = [];
  // On collection, apply filter query with sorting and pagination based on params. Also define schema to populates
  const collection = await ProvinceModel.manageSearchPayload(filterQuery, params, populates);
  return collection;
}// end fn {getProvinces}

/**
 * @method getProvinceByCode
 * Checks if a province exists for the provided province code.
 * @param {string} code - The province code to verify.
 * @returns {Promise<object|null>} - Resolves to the province document if found; otherwise null.
 */
export const getProvinceByCode = async (code) => {
  const province = await ProvinceModel.findOne({ code: code }).exec();
  if (!province) {
    throw new ModelError({ message: "No state found.", code: "BAD_REQUEST", errors: { provinceCode: code } });
  }
  return province;
}// end fn {getProvinceByCode}

/**
 * @method  createLanguage
 * Create a new language.
 * @param {object} payload - Data for the new language.
 */
export const createLanguage = async (payload) => {
  const modelSchema = payload;
  const record = await LanguageModel.create(modelSchema);
  return record;
}// end fn {createLanguage}

/**
 * @method  getLanguages
 * Get languages based on provided parameters.
 * @param {object} params - The query parameters for filtering languages.
 * @returns {Promise<object[]>} - The collection of languages.
 */
export const getLanguages = async (params) => {
  // Build filter query based on query params
  const filterQuery = await LanguageModel.buildQuery(params);
  //Define populate schemas
  const populates = [];
  // On collection, apply filter query with sorting and pagination based on params. Also define schema to populates
  const collection = await LanguageModel.manageSearchPayload(filterQuery, params, populates);
  return collection;
}// end fn {getLanguages}

/**
 * @method  validateLanguageIds
 * Validate a list of language ids
 * @param {Array<string>} ids - The list of language ids to validate
 * @returns {Promise<false|void>} - Returns true if all ids are valid, otherwise throws an error with invalid codes
 */
const validateLanguageCodes = async (codes) => {
  const data = await LanguageModel.find({ code: { $in: codes } }).select("code").lean().exec();
  const exists = data.map(language => language.code);
  const invalidCodes = codes.filter(code => !exists.includes(code));
  console.log(invalidCodes);
  if (invalidCodes.length > 0) {
    throw new ValidatorError({ errors: { languages: `Some provided language's codes are invalid: [ ${invalidCodes.join(",")} ]` } });
  }
  return true;
}// end fn {validateLanguageIds}

/**
 * @method  createInterest
 * Create a new interest.
 * @param {object} payload - Data for the new interest.
 */
export const createInterest = async (payload) => {
  const modelSchema = payload;
  const record = await InterestModel.create(modelSchema);
  return record;
}// end fn {createInterest}

/**
 * @method  getInterests
 * Get interests based on provided parameters.
 * @param {object} params - The query parameters for filtering interests.
 * @returns {Promise<object[]>} - The collection of interests.
 */
export const getInterests = async (params) => {
  // Build filter query based on query params
  const filterQuery = await InterestModel.buildQuery(params);
  //Define populate schemas
  const populates = [];
  // On collection, apply filter query with sorting and pagination based on params. Also define schema to populates
  const collection = await InterestModel.manageSearchPayload(filterQuery, params, populates);
  return collection;
}// end fn {getInterests}

/**
 * @method  validateInterestIds
 * Validate a list of interest ids
 * @param {Array<string>} ids - The list of interest ids to validate
 * @returns {Promise<false|void>} - Returns true if all ids are valid, otherwise throws an error with invalid codes
 */
const validateInterestIds = async (ids) => {
  const interests = ids;
  const data = await InterestModel.find({ _id: { $in: interests } }).select("_id").lean().exec();
  const exists = data.map(interest => interest._id.toString());
  const invalidIds = interests.reduce((invalids, id) => {
    if (!exists.includes(id)) {
      invalids.push(id);
    }
    return invalids;
  }, []);

  if (invalidIds.length > 0) {
    throw new ValidatorError({ errors: { interests: `Some provided interest IDs are invalid: [ ${invalidIds.join(",")} ]` } });
  }
  return true;
}// end fn {validateInterestIds}

/**
 * @method  createExpertise
 * Create a new expertise.
 * @param {object} payload - Data for the new expertise.
 */
export const createExpertise = async (payload) => {
  const modelSchema = payload;
  const record = await ExpertiseModel.create(modelSchema);
  return record;
}// end fn {createExpertise}

/**
 * @method  getExpertises
 * Get expertises based on provided parameters.
 * @param {object} params - The query parameters for filtering expertises.
 * @returns {Promise<object[]>} - The collection of expertises.
 */
export const getExpertises = async (params) => {
  // Build filter query based on query params
  const filterQuery = await ExpertiseModel.buildQuery(params);
  //Define populate schemas
  const populates = [];
  // On collection, apply filter query with sorting and pagination based on params. Also define schema to populates
  const collection = await ExpertiseModel.manageSearchPayload(filterQuery, params, populates);
  return collection;
}// end fn {getExpertises}

/**
 * @method  validateExpertiseIds
 * Validate a list of Expertise ids
 * @param {Array<string>} ids - The list of Expertise ids to validate
 * @returns {Promise<false|void>} - Returns true if all ids are valid, otherwise throws an error with invalid ids
 */
const validateExpertiseIds = async (ids) => {
  const expertises = ids;
  const data = await ExpertiseModel.find({ _id: { $in: expertises } }).select("_id").lean().exec();
  console.log(data);
  const exists = data.map(expertise => expertise._id.toString());
  const invalidIds = expertises.reduce((invalids, id) => {
    if (!exists.includes(id)) {
      invalids.push(id);
    }
    return invalids;
  }, []);

  if (invalidIds.length > 0) {
    throw new ValidatorError({ errors: { expertises: `Invalid ids found. Expertise's invalid ids: ${invalidIds.join(",")}` } });
  }
  return true;
}// end fn {validateExpertiseIds}

/**
 * @method  createSocial
 * Create a new service
 * @param {object} payload - Data for the new social platform.
 */
export const createSocial = async (payload) => {
  const modelSchema = payload;
  const record = await SocialModel.create(modelSchema);
  return record;
}// end fn {createSocial}

/**
 * @method  getSocials
 * Get social platforms based on provided parameters.
 * @param {object} params - The query parameters for filtering social platforms.
 * @returns {Promise<object[]>} - The collection of social platform.
 */
export const getSocials = async (params) => {
  // Build filter query based on query params
  const filterQuery = await SocialModel.buildQuery(params);
  //Define populate schemas
  const populates = [];
  // On collection, apply filter query with sorting and pagination based on params. Also define schema to populates
  const collection = await SocialModel.manageSearchPayload(filterQuery, params, populates);
  return collection;
}// end fn {getSocials}


/**
 * @method  validateSocialCodes
 * Validate a list of social codes
 * @param {Array<string>} codes - The list of social codes to validate
 * @returns {Promise<false|void>} - Returns true if all social codes are valid, otherwise throws an error with invalid social codes
 */
const validateSocialCodes = async (socialIds) => {
  const platforms = socialIds;
  const data = await SocialModel.find({ _id: { $in: platforms } }).select("_id code").lean().exec();
  const exists = data.map(platform => platform._id.toString());
  const invalidCodes = platforms.reduce((invalids, socialID) => {
    if (!exists.includes(socialID)) {
      invalids.push(socialID);
    }
    return invalids;
  }, []);

  if (invalidCodes.length > 0) {
    throw new ValidatorError({ errors: { socials: `Invalid social platforms found. Social's platform codes: ${invalidCodes.join(",")}` } });
  }
  return true;
}//end fn {validateSocialCodes}

/**
 * @method  createService
 * Create a new social platform.
 * @param {object} payload - Data for the new social platform.
 */
export const createService = async (payload) => {
  const servicePayload = payload;
  if (servicePayload.id !== undefined) {
    if (!ServiceModel.isValidID(servicePayload.id)) {
      throw new ModelError({ message: "Invalid service id provided.", code: "BAD_REQUEST", errors: { id: servicePayload.id } });
    }
  }
  const parent = servicePayload.parentService !== undefined ? servicePayload.parentService : null;
  const privatePayload = await ServiceModel.enforceParentService(parent);
  if (servicePayload.id !== undefined) {
    privatePayload._id = servicePayload.id;
  }
  const modelData = Object.assign({}, servicePayload, privatePayload);
  const record = await ServiceModel.create(modelData);
  return record;
}// end fn {createService}

/**
 * @method  getServices
 * Get services based on provided parameters.
 * @param {object} params - The query parameters for filtering services.
 * @returns {Promise<object[]>} - The collection of services.
 */
export const getServices = async (params) => {
  // Build filter query based on query params
  const filterQuery = await ServiceModel.buildQuery(params);
  //Define populate schemas
  const populates = [];
  // const populates = [{ path: "parentService", select: "name level" }];
  // On collection, apply filter query with sorting and pagination based on params. Also define schema to populates
  const collection = await ServiceModel.manageSearchPayload(filterQuery, params, populates);
  return collection;
}// end fn {getSocials}

/**
 * Validates a hierarchy of serviceGroup → ancentor → services[]
 * @param {string} serviceGroup - ID of the root-level service (konw as Industory)
 * @param {string} ancentor - ID of the child service (should be level 1 and child of serviceGroup)
 * @param {string[]} services - Array of service IDs that should be children of the ancentor
 * @throws {ValidatorError} if any of the relationships are invalid
 * @returns {boolean} true if valid
 */
export const validateConsultServices = async (serviceGroup, ancentor, services) => {
  // 1. Check if ancentor exists and at service level 1
  const parent = await ServiceModel.findOne({ _id: ancentor, level: 1 }).exec();
  if (!parent) {
    throw new ValidatorError({ errors: { ancentor: "Invalid parent service provided." } });
  }
  // 2. Check if serviceGroup is parent of ancentor
  if (parent.parentService.toString() !== serviceGroup) {
    throw new ValidatorError({ errors: { serviceGroup: "Invalid service group." } });
  }

  // 3. Check if all services exist and are children of ancentor
  const serviceDocs = await ServiceModel.find({ _id: { $in: services }, parentService: ancentor }).exec();
  const serviceIds = serviceDocs.map(service => service._id.toString());
  const invalids = services.filter(id => !serviceIds.includes(id));
  if (invalids.length > 0) {
    throw new ValidatorError({ errors: { services: `Invalid services found. Service's ids: ${invalids.join(",")}` } });
  }
  return true;
}// end fn {validateConsultServices}

// Export the PlatformAction as collection of methods as class methods
const PlatformAction = {
  getCurrencies,
  getCountries,
  getProvinces,
  getProvinceByCode,
  getLanguages,
  validateLanguageCodes,
  getInterests,
  validateInterestIds,
  getExpertises,
  validateExpertiseIds,
  getSocials,
  validateSocialCodes,
  getServices,
  validateConsultServices
}

export default PlatformAction;
/**
 * @module HttpCore
 * 
 * This module defines the http code's constants that provide status codes for the API.
 */

import ApiError from "../exceptions/api.error.js";

export const SERVICE_TYPES = Object.freeze({
  AUDIO: "audio",
  VIDEO: "video",
  MESSAGE: "message"
});

export const SERVICE_MODES = Object.freeze({
  CHAT: "chat",
  CALL: "call"
});

export const RATE_UNITS = ["message", "minute"];

/**
 * @method getRateServices
 */
export const getRateServices = () => {
  return Object.values(SERVICE_TYPES);
};

/**
 * @method getRateModes
 */
export const getRateModes = () => {
  return Object.values(SERVICE_MODES);
};

/**
 * @method getRateUnits
 */
export const getRateUnits = () => {
  return RATE_UNITS;
};
const ServiceMeta = {
  getRateServices,
  getRateModes,
  getRateUnits
}

export default ServiceMeta;
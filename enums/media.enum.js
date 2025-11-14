/**
 * @module Media
 * 
 * This module defines contants and helper methods to manage uploaded media in our server.
 */

import ApiError from "../exceptions/api.error.js";

/**
 * Define Media Types
 * @readonly
 */
export const UPLOAD_MEDIA_TYPES = Object.freeze({
  IMAGE: {
  },
  VIDEO: {
  },
  AUDIO: {
  },
  DOCUMENT: {
  }
});

/**
 * Define Media Resources
 * @readonly
 */
export const UPLOAD_MEDIA_RESOURCES = Object.freeze({
  PROFILE: {},
  LICENSE: {},
  AADHAAR_FRONT: {},
  AADHAAR_BACK: {},
  LICENSE: {},
  POST: {},
  KYC: {},
  PAGE: {},
  ICON: {},
  SESSION: {},
  DISPUTE: {},
  CHAT: {},
  SUPPORT: {},
});

/**
 * Define Media Resources
 * @readonly
 */
export const MEDIA_DISPLAY_SIZES = Object.freeze({
  BYTE: {},
  KB: {},
  MB: {},
  GB: {},
  TB: {}
});

/**
 * @method getMediaTypes
 */
export const getMediaTypes = () => Object.keys(UPLOAD_MEDIA_TYPES);

/**
 * @method getMediaResources
 */
export const getMediaResources = () => Object.keys(UPLOAD_MEDIA_RESOURCES);

/**
 * @method getMediaResources
 */
export const getMediaSizes = () => Object.keys(MEDIA_DISPLAY_SIZES);

/**
 * @method getMediaTypeMeta
 */
export const getMediaTypeMeta = (mediaType) => {
  if (!Object.prototype.hasOwnProperty.call(UPLOAD_MEDIA_TYPES, mediaType)) {
    throw new ApiError({ message: "Unknown media type provided.", errors: { mediaType }, forClient: false });
  }
  return UPLOAD_MEDIA_TYPES[mediaType];
};

export const getMediaDisplaySize = (sizeInBytes) => {
  if (sizeInBytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
  return parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

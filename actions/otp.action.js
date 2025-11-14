/**
 * @module OtpAction
 * 
 * This module defines the actions related to user authentication.
 */
import Cache from "../../core/providers/cache.provider.js";
import ApiError from "../../core/exceptions/api.error.js";

/**
 * @method getEnforceMetaKey
 * 
 */
const getEnforceMetaKey = ({ prefix, contact, platform }) => {
  const cacheMeta = [prefix, contact, platform];
  return cacheMeta.join(":");
}// end fn {getEnforceMetaKey}

/**
 * @method setEnforceOtp
 * 
 */
const setEnforceOtp = async ({ prefix, contact, platform, code, timer }) => {
  const cacheMeta = getEnforceMetaKey({ prefix, contact, platform });
  return await Cache.setCache(cacheMeta, code, timer);
}// end fn {setEnforceOtp}

/**
 * @method setEnforceAssignOtp
 * 
 */
const setEnforceAssignOtp = async ({ prefix, assign, platform, code, timer }) => {
  const cacheMeta = getEnforceMetaKey({ prefix, contact: assign, platform });
  return await Cache.setCache(cacheMeta, code, timer);
}// end fn {setEnforceAssignOtp}
/**
 * @method getEnforceOtp
 * 
 */
const getEnforceOtp = async ({ prefix, contact, platform }) => {
  const cacheMeta = getEnforceMetaKey({ prefix, contact, platform });
  return await Cache.getCache(cacheMeta);
}// end fn {getEnforceOtp}

/**
 * @method traceEnforceOtp
 * 
 */
const traceEnforceOtp = async ({ prefix, contact, platform }) => {
  const cacheMeta = getEnforceMetaKey({ prefix, contact, platform });
  const cooldown = await Cache.ttlCooldown(cacheMeta);
  if (cooldown > 0) {
    throw new ApiError({ message: "OTP request limit reached. Please wait untill cooldown time expires.", code: "COOLDOWN_ACTIVE", errors: { cooldown: cooldown } })
  }
  return cooldown;
}// end fn {traceEnforceOtp}

/**
 * @method setEnforceCooldown
 * 
 */
const setEnforceCooldown = async ({ prefix, contact, platform, code, timer }) => {
  const cacheMeta = getEnforceMetaKey({ prefix, contact, platform });
  return await Cache.setCache(cacheMeta, code, timer);
}// end fn {setEnforceCooldown}


/**
 * @method traceEnforceCooldown
 * 
 */
const traceEnforceCooldown = async ({ prefix, contact, platform }) => {
  const cacheMeta = getEnforceMetaKey({ prefix, contact, platform });
  const cooldown = await Cache.ttlCooldown(cacheMeta);
  if (cooldown > 0) {
    throw new ApiError({ message: "OTP request limit reached. Please wait untill cooldown time expires.", code: "COOLDOWN_ACTIVE", errors: { cooldown: cooldown } })
  }
  return cooldown;
}// end fn {traceEnforceCooldown}

const setEnforceAuth = async ({ group, prefix, contact, platform, payload: payload }) => {
  const cacheMeta = getEnforceMetaKey({ prefix, contact, platform });
  return await Cache.setHashCache(group, cacheMeta, payload);
}// end fn {setEnforceAuth}

const traceEnforceAuth = async ({ group, prefix, contact, platform }) => {
  const cacheMeta = getEnforceMetaKey({ prefix, contact, platform });
  const trace = await Cache.getHashCache(group, cacheMeta);
  if (!trace) {
    throw new ApiError({ message: "Something went wrong while auth process. Please login again.", code: "AUTH_PROCESS_ERROR" });
  }
  return trace;
}// end fn {traceEnforceAuth}

const traceEnforceAssign = async ({ group, prefix, contact, platform }) => {
  const cacheMeta = getEnforceMetaKey({ prefix, contact, platform });
  const trace = await Cache.getHashCache(group, cacheMeta);
  if (!trace) {
    throw new ApiError({ message: "Something went wrong while auth process. Please login again.", code: "AUTH_PROCESS_ERROR" });
  }
  return trace;
}// end fn {traceEnforceAuth}

const revokeEnforceAuth = async ({ group, prefix, contact, platform }) => {
  const cacheMeta = getEnforceMetaKey({ prefix, contact, platform });
  return await Cache.deleteHashCache(group, cacheMeta);
}// end fn {revokeEnforceAuth}

const OtpAction = {
  setEnforceOtp,
  setEnforceAssignOtp,
  getEnforceOtp,
  traceEnforceOtp,
  setEnforceCooldown,
  traceEnforceCooldown,
  setEnforceAuth,
  traceEnforceAuth,
  revokeEnforceAuth
}

export default OtpAction;
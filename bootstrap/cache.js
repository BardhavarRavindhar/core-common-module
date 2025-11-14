/**
 * @module Cache
 * 
 * Provide Cache service-related handlers with optimized scalability.
 */
import Redis from "ioredis";
import logger from "../utils/logger.util.js";
import CONFIG from "../configs/api.config.js";
const { REDIS } = CONFIG;

// Create a Redis client using connection string with DB index
export const cacheClient = new Redis(`${REDIS.URI}/${REDIS.DB}`);

// Log Redis connection events
cacheClient.on('error', (error) => logger.error(`Redis connection error: ${error.message}`));

/**
 * Initialize Redis connection
 */
/**
 * @method initCacheService
 * Initialize Redis connection
**/
export const initCacheService = async () => {
  try {
    await cacheClient.ping();
    logger.info("CacheService connected successfully.");
  } catch (error) {
    logger.error(`CacheService initialization error: ${error.message}`);
    throw error;
  }
};

/**
* @method quitCacheService
* Gracefully close Redis connection
**/
export const quitCacheService = async () => {
  try {
    await cacheClient.quit();
    logger.info("CacheService disconnected successfully.");
  } catch (error) {
    logger.error(`CacheService disconnection error: ${error.message}`);
    throw error;
  }
};
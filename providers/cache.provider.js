/**
 * @module CacheService
 * 
 * Provide methods to handles caching mechanism for entire application system.
 */
import { cacheClient } from "../bootstrap/cache.js";
import zlib from "node:zlib";
import { Buffer } from "node:buffer";

// Promisify Redis client methods for async/await usage
const set = cacheClient.set.bind(cacheClient);
const get = cacheClient.get.bind(cacheClient);
const expireTime = cacheClient.ttl.bind(cacheClient);
const hset = cacheClient.hset.bind(cacheClient);
const hdel = cacheClient.hdel.bind(cacheClient);
const hget = cacheClient.hget.bind(cacheClient);
const unlink = cacheClient.unlink.bind(cacheClient);
const scan = cacheClient.scan.bind(cacheClient);
const incr = cacheClient.incr.bind(cacheClient);

// Minify JSON data by compressing it and encoding it in base64
const minify = (jsonData) => {
  let cacheValue = JSON.stringify(jsonData);
  cacheValue = zlib.deflateSync(cacheValue).toString('base64');
  return cacheValue
}

// Unminify JSON data by decoding it from base64 and decompressing it
const unminify = (minifyJsonData) => {
  let cacheValue = zlib.inflateSync(Buffer.from(minifyJsonData, "base64")).toString();
  cacheValue = JSON.parse(cacheValue);
  return cacheValue
}

// Set cache with optional time-to-live (ttl) in seconds
export const setCache = async (key, value, ttl = 0) => {
  if (ttl > 0) {
    await set(key, value, 'EX', ttl);
  } else {
    await set(key, value);
  }
};

// Get cache by key
export const getCache = async (key) => {
  return await get(key);
};

// Get cache expires time by key
export const ttlCooldown = async (key) => {
  const ttl = await expireTime(key);
  let expires = 0;
  if (expires < ttl) {
    expires = ttl;
  }
  return expires;
};

// Set hash cache with minified value
export const setHashCache = async (setName, key, value) => {
  const data = minify(value);
  await hset(setName, key, data);
};

// Get hash cache and unminify the value
export const getHashCache = async (setName, key) => {
  let data = null;
  const value = await hget(setName, key);
  if (value !== undefined && value !== null) {
    data = unminify(value);
  }
  return data
};

// Set counter first time with 0 and it not update ttl
export const setCounter = async (key, ttl = 300) => {
  return await set(key, 0, 'EX', ttl, 'NX');
};
// Increments counter by 1 and default 0
export const counter = async (key) => {
  return await incr(key);
};

// Delete hash cache
export const deleteHashCache = async (setName, key) => {
  const data = await hdel(setName, key);
  return data
};

// Unlink (delete) cache by key
export const unlinkCache = async (key) => {
  return await unlink(key);
};

// Delete cache keys matching a pattern
export const delCacheWithPattern = async (prefix) => {
  const pattern = `${prefix}*`;
  let cursor = '0';
  do {
    const reply = await scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = reply[0];
    const keys = reply[1];
    if (keys.length > 0) {
      const pipeline = cacheClient.pipeline();
      keys.forEach((key) => pipeline.unlink(key));
      await pipeline.exec(); // Execute batch deletion
    }
  } while (cursor !== '0');
};

const CacheService = {
  ttlCooldown,
  counter,
  setCounter,
  setCache,
  getCache,
  setHashCache,
  getHashCache,
  deleteHashCache,
  unlinkCache,
  delCacheWithPattern
}
export default CacheService;
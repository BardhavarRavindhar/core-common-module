/**
 * @module RateGuard
 * 
 * flexible and scalable rate limiting using Redis
 */

import { RateLimiterRedis } from "rate-limiter-flexible";
import { cacheClient } from "../bootstrap/cache.js";
import ApiError from "../exceptions/api.error.js";

/**
 * Creates a rate limiter middleware.
 * @param {Object} options - Configuration for the rate limiter.
 * @param {string} options.keyPrefix - Prefix for Redis keys.
 * @param {number} options.points - Maximum allowed requests per window.
 * @param {number} options.duration - Time window in seconds.
 * @param {number} options.blockDuration - Block duration after exceeding limit (in seconds).
 * @returns {Function} - Express middleware for rate limiting.
 */
const createRateGuard = ({
  keyPrefix = "rl",
  points = 100,
  duration = 60,
  blockDuration = 120,
} = {}) => {
  const rateLimiter = new RateLimiterRedis({
    storeClient: cacheClient,
    keyPrefix,
    points,
    duration,
    blockDuration,
    inMemoryBlockOnConsumed: points + 1, // Prevent excessive requests from consuming Redis calls.
  });

  return async (req, res, next) => {
    try {
      //Set key to handle rate limiter check
      const consumerKey = req.ip;
      //Consume allowed request by consume key
      await rateLimiter.consume(consumerKey);
      //Get status of consumer
      const consumerStatus = await rateLimiter.get(consumerKey);
      res.set({
        "X-RateLimit-Limit": rateLimiter.points,
        "X-RateLimit-Remaining": consumerStatus.remainingPoints,
        "X-RateLimit-Retry-After": Math.ceil(consumerStatus.msBeforeNext / 1000),
      });

      next();
    } catch (error) {
      if (error.remainingPoints !== undefined) {
        //Set response header
        const consumerStatus = error;
        res.set({
          "X-RateLimit-Limit": rateLimiter.points,
          "X-RateLimit-Remaining": consumerStatus.remainingPoints,
          "X-RateLimit-Retry-After": Math.ceil(consumerStatus.msBeforeNext / 1000),
        });
        next(new ApiError({ message: "Too many requests. Please try again after cooldown.", code: "RATE_LIMIT_EXCEEDED" }));

      } else {
        next(error);
      }
    }
  };
};

// Define multiple rate limiters for different parts of the application
export const PanelRateGuard = createRateGuard({
  keyPrefix: "x-rateguard-panel",
  points: 60, // Allow 60 requests per minute
  duration: 120,
  blockDuration: 120 // Block for 2 minutes
});

export const AuthRateGuard = createRateGuard({
  keyPrefix: "x-rateguard-auth",
  points: 10, // Allow only 3 authentication attempts per minute
  duration: 300,
  blockDuration: 300
});

export const ApiRateGuard = createRateGuard({
  keyPrefix: "x-rategaurd-api",
  points: 30, // Allow 30 API requests per minute
  duration: 60,
  blockDuration: 60
});


/**
 * @module catchAsync
 * 
 * This module provides a utility function to catch and handle asynchronous errors in Express routes.
 * It wraps an asynchronous function and passes any errors to the next middleware.
 * 
 */

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
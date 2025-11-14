/**
 * @module CodeGenerator
 * 
 * This module provides utility functions for generating various types of codes
 * for verification and identification purposes.
 */

import qrcode from "qrcode";
import objectHash from "object-hash";
import crypto from "node:crypto";

// Constants used for unique code generation via a random byte pool.
const RANDOM_POOL_EXPANSION_FACTOR = 128;
const RANDOM_POOL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
let pool = null, poolIndex = 0;

/**
 * @method generateNumericCode
 * Generates a random numeric code of a specified length.
 * @param {number} [digits=6] - The number of digits for the numeric code.
 * @returns {string} The generated numeric code.
 */
const generateNumericCode = (digits = 6) => {
  const numbers = "0123456789";
  let code = "";
  // Ensure 'digits' is treated as a number and iterate that many times.
  let count = digits | 0;
  while (count--) {
    // Use bitwise OR to floor the value, which is slightly more compact than Math.floor.
    code += numbers[(Math.random() * numbers.length) | 0];
  }
  return code;
};

/**
 * @method refillPool
 * Refills the random byte pool if needed to avoid excessive crypto calls.
 * This ensures efficient random byte generation by reusing a pre-filled pool.
 * @param {number} size - Number of random bytes required.
 */
const refillPool = (size) => {
  // If no pool exists or if the current pool is too small for the requested size,
  // create a new pool with an expansion factor for efficiency.
  if (!pool || pool.length < size) {
    pool = Buffer.allocUnsafe(size * RANDOM_POOL_EXPANSION_FACTOR);
    crypto.randomFillSync(pool);
    poolIndex = 0;
  } else if (poolIndex + size > pool.length) {
    // If remaining bytes in the pool are insufficient, refill the entire pool.
    crypto.randomFillSync(pool);
    poolIndex = 0;
  }
  poolIndex += size; // Advance the pool index by the number of bytes requested.
};

/**
 * @method  generateUniqueCode
 * Generates a unique, URL-safe identifier of the given size using a pre-filled random byte pool.
 * @param {number} [size=21] - Desired length of the generated code.
 * @returns {string} The unique identifier.
 */
export const generateUniqueCode = (size = 21) => {
  // Coerce size to an integer and ensure the random pool has enough bytes.
  size = size | 0;
  refillPool(size);

  let id = "";
  // Map each random byte (masked to 6 bits) to a character from the defined alphabet.
  for (let i = poolIndex - size; i < poolIndex; i++) {
    const index = pool[i] & 63;
    if (RANDOM_POOL_ALPHABET[index] !== undefined) {
      id += RANDOM_POOL_ALPHABET[index];
    }
  }
  return id;

};

/**
 * @method generateCode
 * Generates a random numeric code.
 * @param {number} [digits=6] - The number of digits for the numeric code.
 * @returns {Promise<string>} A promise that resolves to the generated numeric code.
 */
export const generateCode = async (digits = 6) => generateNumericCode(digits);

/**
 * @method  generateQR
 * Generates a QR code from the given content.
 * @param {string} content - The content to encode in the QR code.
 * @returns {Promise<string>} A promise that resolves to the data URL of the generated QR code.
 */
export const generateQR = async (content) => await qrcode.toDataURL(content);

/**
 * @method generateHash 
 * Generates a hash for the given value.
 * @param {string} value - The input string to hash.
 * @returns {Promise<string>} A promise that resolves to the generated hash.
 */
export const generateHash = async (value) => objectHash(value);

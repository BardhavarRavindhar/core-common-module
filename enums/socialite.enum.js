/**
 * @module Socialite
 * 
 * This module defines social authentication providers and helper methods.
 */

const Socialite = Object.freeze({
  /** 
   * Supported Social Authentication Providers 
   * @constant {Object} providers
   */
  providers: {
    GOOGLE: "GOOGLE",
    FACEBOOK: "FACEBOOK",
    APPLE: "APPLE",
    PLATFORM: "PLATFORM"
  },

  /** 
   * Retrieves all authentication providers in the system
   * @returns {string[]} List of provider names.
   */
  getAllProviders() {
    return Object.keys(this.providers);
  },

  /** 
  * Retrieves all social authentication providers.
  * @returns {string[]} List of provider names.
  */
  getAuthProviders() {
    return Object.keys(this.providers).filter((provider) => provider !== "PLATFORM");
  },

  /** 
   * Checks if a given provider is a valid social authentication provider.
   * @param {string} provider - The provider name to validate (default: "GOOGLE").
   * @returns {boolean} `true` if the provider is valid, otherwise `false`.
   */
  hasValidProvider(provider = "GOOGLE") {
    return Object.hasOwn(this.providers, provider);
  },
});

export default Socialite;

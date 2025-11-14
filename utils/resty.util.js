/**
* @module Resty
* 
* Utility for making rest api calls
*/
import RestClient from "got";

class Resty {
  /**
    * Makes a POST request
    * @param {string} url - The API endpoint
    * @param {Object} body - Request body
    * @param {Object} headers - Custom headers (optional)
    * @returns {Promise<Object>} - API response data
    */
  static async postRequest({ url, body = undefined, headers = undefined }) {
    const response = await RestClient.post(url, {
      json: body,
      headers: headers,
      responseType: "json",
    });
    return response.body;
  }

  /**
   * Makes a GET request
   * @param {string} url - The API endpoint
   * @param {Object} body - Request body
   * @param {Object} searchParams - Allowed search params (optional)
   * @param {Object} headers - Allowed headers (optional)
   * @returns {Promise<Object>} - API response data
   */
  static async getRequest({ url, searchParams = undefined, headers = undefined }) {
    const response = await RestClient.get(url, {
      searchParams: searchParams,
      responseType: 'json'
    });
    return response.body;
  }
}

export default Resty;
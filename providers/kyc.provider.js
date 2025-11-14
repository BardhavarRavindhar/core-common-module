/**
 * @module SurepassProvider
 * 
 * Provide methods to handle Surepass API for KYC and verification services.
 */

import CONFIG from "../configs/api.config.js";
import Resty from "../utils/resty.util.js";
import ServiceError from "../exceptions/service.error.js";

const { SUREPASS } = CONFIG;

class KycProvider {
  static BASE_URL = "https://kyc-api.surepass.io/api/v1";
  static TOKEN = SUREPASS.TOKEN;
  static SERVICE_NAME = "SurePass";
  static SERVICE_ERROR = {
    serviceName: "SurePass",
    code: "BAD_REQUEST",
    message: "Wrong api endpoint given."
  }

  /**
   * Common function to make API requests to Surepass.
   * @param {string} endpoint - The API endpoint.
   * @param {Object} body - The request body.
   * @returns {Promise<Object>} - API response.
   */
  static async makeRequest(endpoint, body) {

    const url = `${this.BASE_URL}/${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.TOKEN}`
    };
    const response = await Resty.postRequest({
      url,
      body,
      headers
    });
    return response;

  }

  /**
   * Generate OTP for Aadhaar verification.
   * @param {string} aadhaarNumber - Aadhaar number to generate OTP for.
   * @returns {Promise<Object>} - API response.
   */
  static async verifyAadhaar(aadhaarNo) {
    try {
      const aadhaarStatus = await this.makeRequest("aadhaar-v2/generate-otp", { id_number: aadhaarNo });
      return aadhaarStatus;
    } catch (error) {
      if (error.response !== undefined && error.response.statusCode !== undefined) {
        const code = error.response.statusCode;
        if (code == "ERR_INVALID_URL") {
          error = new ServiceError(this.SERVICE_ERROR);
        }
        if (code == 422) {
          this.SERVICE_ERROR.message = "Invalid aadhaar number provided.";
          error = new ServiceError(this.SERVICE_ERROR);
        }

        if (code == 429) {
          this.SERVICE_ERROR.code = "RATE_LIMIT_EXCEEDED";
          this.SERVICE_ERROR.message = "Too many requests for aadhaar verification.";
          error = new ServiceError(this.SERVICE_ERROR);
        }
      }
      throw error;
    }
  }

  /**
   * Verify Aadhaar OTP.
   * @param {string} client_id - Client ID to verify OTP for.
   * @param {string} otp - OTP to verify.
   * @returns {Promise<Object>} - API response.
   */
  static async verifyAadhaarOtp(client_id, otp) {
    try {
      const aadhaarStatus = await this.makeRequest("aadhaar-v2/submit-otp", { client_id, otp });
      return aadhaarStatus;
    } catch (error) {
      if (error.response !== undefined && error.response.statusCode !== undefined) {
        const code = error.response.statusCode;

        if (code == "ERR_INVALID_URL") {
          error = new ServiceError(this.SERVICE_ERROR);
        }
        if (code == 422) {
          this.SERVICE_ERROR.message = "Adhaar verification failed.";
          error = new ServiceError(this.SERVICE_ERROR);
        }

        if (code == 429) {
          this.SERVICE_ERROR.code = "RATE_LIMIT_EXCEEDED";
          this.SERVICE_ERROR.message = "Too many requests for aadhaar otp verification.";
          error = new ServiceError(this.SERVICE_ERROR);
        }
      }
      throw error;
    }
  }

  /**
   * Verify PAN number.
   * @param {string} panNumber - PAN number to verify.
   * @returns {Promise<Object>} - API response.
   */
  static async verifyPan(panNumber) {
    try {
      const panStatus = await this.makeRequest("pan/pan", { id_number: panNumber });
      if (panStatus.success !== undefined && panStatus.success === true) {
        return true;
      }
      return false;
    } catch (error) {
      if (error.response !== undefined && error.response.statusCode !== undefined) {
        const code = error.response.statusCode;

        if (code == "ERR_INVALID_URL") {
          error = new ServiceError(this.SERVICE_ERROR);
        }
        if (code == 422) {
          this.SERVICE_ERROR.message = "Invalid pan number provided.";
          error = new ServiceError(this.SERVICE_ERROR);
        }
      }// end if {code}
      throw error;
    }// end catch
  }
}

export default KycProvider;
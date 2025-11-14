/**
 * @module SmsService
 * 
 * Provide methods to handle Twilio API for SMS and OTP sending.
 */
import twilio from "twilio";
import CONFIG from "../configs/api.config.js";
import transformTwilioError from "../transformers/twilio-error.transformer.js";
import Resty from "../utils/resty.util.js";
import ApiError from "../exceptions/api.error.js";

const { PLATFORM_NAME, TWILIO, SMS } = CONFIG;

class SmsService {
  static ACCOUNT_SID = TWILIO.ACCOUNT_SID;
  static AUTH_TOKEN = TWILIO.AUTH_TOKEN;
  static PHONE_NUMBER = TWILIO.PHONE_NUMBER;
  static REMARK = `Team ${PLATFORM_NAME}`;

  // Twilio client initialization
  static CLIENT = twilio(SmsService.ACCOUNT_SID, SmsService.AUTH_TOKEN);

  /**
   * @method sendSMS
   * Send an SMS message.
   * @param {string} to - Recipient phone number (E.164 format, e.g., +1234567890).
   * @param {string} body - Message content.
   * @returns {Promise<object>} - Result of the SMS send operation.
   */
  static async sendSMS(phone, message) {
    try {
      const SMS = await SmsService.CLIENT.messages.create({
        friendlyName: PLATFORM_NAME,
        body: message,
        to: phone,
        from: SmsService.PHONE_NUMBER,
      });
      return {
        sid: SMS.sid,
        phone: SMS.to
      };
    } catch (error) {
      error = transformTwilioError(error);
      throw error;
    }
  }

  /**
   * @method sendOTP
   * Send an OTP message.
   * @param {string} to - Recipient phone number (E.164 format).
   * @param {string} otp - OTP to send.
   * @returns {Promise<object>} - Result of the OTP send operation.
   */
  static async sendOTP(clientPhone, otp, otpExpires = 2) {

    const body = {
      template_id: "67cecb8cd6fc055cb52d4912",
      realTimeResponse: "1",
      recipients: [
        {
          mobiles: `${clientPhone}`,
          var1: `${otp}`
        }
      ]
    }
    const url = `${SMS.API_URL}`;
    const headers = {
      authkey: `${SMS.API_KEY}`,
      accept: 'application/json'
    };
    const response = await Resty.postRequest({
      url,
      body,
      headers
    });
    if (response.type !== undefined && response.type === "success") {
      return response;
    }
    throw new ApiError({ message: "SMS API error", code: "INTERNAL_SERVER_ERROR", errors: response, forClient: false });

  }
}

export default SmsService;
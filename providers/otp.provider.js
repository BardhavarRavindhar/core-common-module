/**
 * @module OtpService
 * 
 * This module provides services related to OTP (One-Time Password) generation, validation, and management.
 *
 */
import { generateCode } from "../utils/codegen.util.js";
import Mailer from "./mailer.provider.js";
import SmsService from "./sms.provider.js";
import OtpAction from "../actions/otp.action.js";
import ApiError from "../exceptions/api.error.js";

class OtpService {

  static OTP_LIMIT = 3;
  static OTP_LIMIT_TIMER = 300; // 5 minutes
  static OTP_EXPIRATION_TIMER = 120; // 2 minutes
  static OTP_COOLDOWN_TIMER = 30; // 30 seconds
  static OTP_REVOKE_TIME = 2; // 2 minutes
  static OTP_LENGTH = 4;
  static ENFORCE_CODE_META = "enforce:code";
  static ENFORCE_COOLDOWN_META = "enforce:cooldown";
  static ENFORCE_AUTH_TRACE_GROUP = "trace:process";
  static ENFORCE_AUTH_TRACE_META = "enforce:auth";

  static ENFORCE_ASSIGN_CODE = "enforce:code:assign";
  static ENFORCE_ASSIGN_TRACE_GROUP = "trace:assign:process";
  static ENFORCE_ASSIGN_TRACE_META = "enforce:assign";


  static async provideOtp() {
    const code = await generateCode(this.OTP_LENGTH);
    return code;
  }// end fn {sendOtp}

  static async sendOtp({ code, contact, defaultMode = true }) {
    let messenger;
    if (defaultMode) {
      /**@info Send OTP on mobile **/
      const SMS = await SmsService.sendOTP(`+91${contact}`, code, this.OTP_REVOKE_TIME);
      messenger = SMS;
    } else {
      /**@info Send OTP on email **/
      const mail = await Mailer.otpMail({ to: contact, otp: code, otpExpires: this.OTP_REVOKE_TIME });
      messenger = mail;
    }

    return messenger;
  }// end fn {sendOtp}

  static async setEnforceTraceMeta({ contact, platform, code, payload }) {
    /**@info Enforce Meta Cache keys for auth process validation **/
    await OtpAction.setEnforceOtp({ prefix: this.ENFORCE_CODE_META, contact, platform, code, timer: this.OTP_EXPIRATION_TIMER });
    await OtpAction.setEnforceCooldown({ prefix: this.ENFORCE_COOLDOWN_META, contact, platform, code, timer: this.OTP_COOLDOWN_TIMER });
    await OtpAction.setEnforceAuth({ group: this.ENFORCE_AUTH_TRACE_GROUP, prefix: this.ENFORCE_AUTH_TRACE_META, contact, platform, payload: payload });
  }

  static async setEnforceAssignMeta({ assign, platform, code, payload }) {
    /**@info Enforce Meta Cache keys for auth process validation **/
    await OtpAction.setEnforceOtp({ prefix: this.ENFORCE_ASSIGN_CODE, contact: assign, platform, code, timer: this.OTP_EXPIRATION_TIMER });
    await OtpAction.setEnforceAuth({ group: this.ENFORCE_ASSIGN_TRACE_GROUP, prefix: this.ENFORCE_ASSIGN_TRACE_META, contact: assign, platform, payload: payload });
    await OtpAction.setEnforceCooldown({ prefix: this.ENFORCE_ASSIGN_TRACE_META, contact: assign, platform, code, timer: this.OTP_COOLDOWN_TIMER });

  }
  static async enforceExpireAssignOtp({ contact, platform }) {
    console.log("Assign", this.ENFORCE_ASSIGN_CODE,);
    await this.enforceExpireOtp({ prefix: this.ENFORCE_ASSIGN_CODE, contact, platform });
  }
  static async traceEnforceOtp({ contact, platform }) {
    await OtpAction.traceEnforceOtp({ prefix: this.ENFORCE_CODE_META, contact, platform });
  }

  static async traceEnforceResendOtp({ contact, platform }) {
    await OtpAction.traceEnforceCooldown({ prefix: this.ENFORCE_COOLDOWN_META, contact, platform });
  }

  static async traceEnforceAuthProcess({ contact, platform }) {
    return await OtpAction.traceEnforceAuth({ group: this.ENFORCE_AUTH_TRACE_GROUP, prefix: this.ENFORCE_AUTH_TRACE_META, contact, platform });

  }

  static async traceEnforceAssignProcess({ contact, platform }) {
    return await OtpAction.traceEnforceAuth({ group: this.ENFORCE_ASSIGN_TRACE_GROUP, prefix: this.ENFORCE_ASSIGN_TRACE_META, contact, platform });

  }
  static async revokeTraceEnforceAuth({ contact, platform }) {
    await OtpAction.revokeEnforceAuth({ group: this.ENFORCE_AUTH_TRACE_GROUP, prefix: this.ENFORCE_AUTH_TRACE_META, contact, platform });
  }

  static async verifyAssignCode({ code, assignCode, httpCode = "OTP_FORBIDDEN" }) {
    code = +code;
    assignCode = +assignCode;

    if (code !== assignCode) {
      throw new ApiError({ message: "OTP verification failed. Please confirm and try again.", code: httpCode });
    }
    return true;
  }

  static async enforceExpireOtp({ prefix = this.ENFORCE_CODE_META, contact, platform, httpCode = "EXPIRED_TOKEN" }) {

    const cacheMeta = await OtpAction.getEnforceOtp({ prefix: prefix, contact, platform });
    console.log(prefix, contact, platform);
    if (!cacheMeta) {
      throw new ApiError({ message: "OTP has expired. Please request new OTP again.", code: httpCode });
    }
    return cacheMeta;
  }
}

export default OtpService;
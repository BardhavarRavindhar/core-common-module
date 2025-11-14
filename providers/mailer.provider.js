/**
 * @module MailerService
 * 
 * Provides email functionality using Nodemailer and EJS templates.
 */

import { join } from "path";
import nodemailer from "nodemailer";
import ejs from "ejs";
import CONFIG from "../configs/api.config.js";

const { MAILER, PLATFORM_MAILS, PLATFORM_NAME } = CONFIG;

class MailerService {
  static transporter = nodemailer.createTransport({
    host: MAILER.SMTP_HOST,
    port: MAILER.SMTP_PORT,
    secure: MAILER.SECURE, // true for 465, false for other ports
    auth: {
      user: MAILER.USER,
      pass: MAILER.PASS
    },
  });

  static REMARK = `Team ${PLATFORM_NAME}`;
  static FROM_MAIL = PLATFORM_MAILS.SERVICE;

  /**
   * Send an email using a predefined transport
   * @param {Object} options - Email details
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.templateName - EJS template name (without extension)
   * @param {Object} options.data - Data to be injected into the template
   * @returns {Promise<Object>} - Nodemailer response
   */
  static async sendEmail({ to, subject, templateName, data }) {
    const templateFile = join(MAILER.TEMPLATE_DIR, `${templateName}.ejs`);
    const content = await ejs.renderFile(templateFile, data);

    const mailerResponse = await MailerService.transporter.sendMail(
      { from: MailerService.FROM_MAIL, to, subject, content }
    );
    return mailerResponse;
  }

  /**
   * Send an email using a predefined transport
   * @param {Object} options - Email details
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Message for plain email
   * @returns {Promise<Object>} - Nodemailer response
   */
  static async sendText({ to, subject, text }) {
    const mailerResponse = await MailerService.transporter.sendMail(
      { from: MailerService.FROM_MAIL, to, subject, text }
    );

    return mailerResponse;
  }

  static async otpMail({ mailType = "text", to, subject = "Email Verification - Team Experta", otp, otpExpires = 2 }) {
    const text = `Your account OTP is ${otp} to verify your identity and valid for ${otpExpires} minutes. Do not share with anyone.\n\nThank you. \n${MailerService.REMARK}`;
    const mail = await MailerService.sendText({ to, subject, text });
    return mail
  }
}

export default MailerService;
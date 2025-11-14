/**
 * @module ENV
 * 
 * This module ensures that all the environment variables are present and have the correct type.
 * It prevents runtime errors due to missing or incorrect environment variables.
 */

import parseENV from "env-var";
import dotenv from "dotenv";

// Load environment variables for setup application environment
const envPath = ".env";
dotenv.config({ path: envPath });

// Helper function for required variables with custom error messages
const requiredString = (key) => parseENV.get(key).required().asString();
const requiredURL = (key) => parseENV.get(key).required().asUrlString();
const optionalString = (key, optionalString) => parseENV.get(key).default(optionalString).asString();


const ENV = {
  // App related config
  NODE_ENV: optionalString("NODE_ENV", "local"),
  APP_PORT: parseENV.get("APP_PORT").required().asPortNumber(),

  // PLATFORM SETTINGS
  APP_NAME: optionalString("APP_NAME", "Experta"),
  PLATFORM_SESSION_LIMIT: parseENV.get("PLATFORM_SESSION_LIMIT").default('3').asIntPositive(),

  // Platform Domains
  PLATFORM_BRAND_DOMAIN: requiredURL("PLATFORM_BRAND_DOMAIN"),
  PLATFORM_WEB_DOMAIN: requiredURL("PLATFORM_WEB_DOMAIN"),
  PLATFORM_CLOUDSTORAGE_DOMAIN: requiredURL("PLATFORM_CLOUDSTORAGE_DOMAIN"),

  // PLATFORM EMAILS
  PLATFORM_SUPPORT_MAIL: requiredString("PLATFORM_SUPPORT_MAIL"),
  PLATFORM_SERVICE_MAIL: requiredString("PLATFORM_SERVICE_MAIL"),

  // PLATFORM SOCIALS
  PLATFORM_SOCIAL_FACEBOOK: requiredURL("PLATFORM_SOCIAL_FACEBOOK"),
  PLATFORM_SOCIAL_TWITTER: requiredURL("PLATFORM_SOCIAL_TWITTER"),
  PLATFORM_SOCIAL_LINKEDIN: requiredURL("PLATFORM_SOCIAL_LINKEDIN"),
  PLATFORM_SOCIAL_INSTAGRAM: requiredURL("PLATFORM_SOCIAL_INSTAGRAM"),
  PLATFORM_SOCIAL_YOUTUBE: requiredURL("PLATFORM_SOCIAL_YOUTUBE"),

  // Database Configs
  MONGODB_URI: requiredURL("MONGODB_URI"),
  MONGODB_NAME: requiredString("MONGODB_NAME"),

  // Redis
  REDIS_URI: requiredURL("REDIS_URI"),
  REDIS_DB: parseENV.get("REDIS_DB").default(0).asIntPositive(),

  // MAILER
  MAILER_SMTP_HOST: requiredString("MAILER_SMTP_HOST"),
  MAILER_SMTP_PORT: parseENV.get("MAILER_SMTP_PORT").required().asEnum(["465", "25", "587", "2525"]),
  MAILER_USER: requiredString("MAILER_USER"),
  MAILER_PASS: requiredString("MAILER_PASS"),

  // RAZORPAY
  RAZORPAY_API_KEY: requiredString("RAZORPAY_API_KEY"),
  RAZORPAY_SECRET: requiredString("RAZORPAY_SECRET"),
  RAZORPAY_PLATFORM_ACCOUNT: parseENV.get("RAZORPAY_PLATFORM_ACCOUNT").required().asIntPositive(),

  // JWT
  JWT_ACCESS_SECRET: requiredString("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: requiredString("JWT_REFRESH_SECRET"),

  // Twilio
  TWILIO_ACCOUNT_SID: requiredString("TWILIO_ACCOUNT_SID"),
  TWILIO_AUTH_TOKEN: requiredString("TWILIO_AUTH_TOKEN"),
  TWILIO_PHONE_NUMBER: requiredString("TWILIO_PHONE_NUMBER"),

  // SMS API
  SMS_API_KEY: requiredString("SMS_API_KEY"),

  //SUREPASS_TOKEN
  SUREPASS_TOKEN: requiredString("SUREPASS_TOKEN"),

  //AWS S3
  AWS_ACCESS_KEY: requiredString("AWS_ACCESS_KEY"),
  AWS_SECRET_KEY: requiredString("AWS_SECRET_KEY"),
  AWS_REGION: requiredString("AWS_REGION"),
  AWS_BUCKET: requiredString("AWS_BUCKET"),

  // FIREBASE ADMIN for PUSH NOTIFICATION
  FIREBASE_PROJECT_ID: requiredString("FIREBASE_PROJECT_ID"),
  FIREBASE_CLIENT_EMAIL: requiredString("FIREBASE_CLIENT_EMAIL"),
  FIREBASE_PRIVATE_KEY: requiredString("FIREBASE_PRIVATE_KEY"),

  // Google Login
  GOOGLE_CLIENT_ID: requiredString("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: requiredString("GOOGLE_CLIENT_SECRET"),
  GOOGLE_REDIRECT_URI: requiredString("GOOGLE_REDIRECT_URI"),

  // Facebook Login
  FACEBOOK_CLIENT_ID: requiredString("FACEBOOK_CLIENT_ID"),
  FACEBOOK_CLIENT_SECRET: requiredString("FACEBOOK_CLIENT_SECRET"),
  FACEBOOK_REDIRECT_URI: requiredString("FACEBOOK_REDIRECT_URI"),

};

export default ENV;
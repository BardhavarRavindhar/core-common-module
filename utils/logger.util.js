/**
 * @module logger
 * 
 * This module used for logging errors and messages for debug application.
 * It includes functions to log messages at different levels such as info, warn, and error.
 * 
 */

import pino from "pino";
import { getCurrentTimestamp } from "./timer.util.js";
import CONFIG from "../configs/api.config.js";

const { PLATFORM_LOG_DIR } = CONFIG;

/** Custom timestamp function for more readable datetime in logs file */
const customTimestamp = () => `,"time":"${getCurrentTimestamp()}"`;

/**
 * Create a Pino logger instance with custom settings
 */
const logger = pino({
  level: "info", // Default log level
  timestamp: customTimestamp, // Use custom timestamp function
  transport: {
    targets: [
      {
        target: "pino-pretty", // Pretty print logs to console
        level: "info", // Log all levels to console
        options: {
          colorize: true,
          translateTime: "SYS:standard", // Use system time in standard format
          singleLine: true,
          messageFormat: "{msg} {obj}"
        },
      },
      {
        target: "pino-roll", // Rolling file logging
        level: "error", // Log only error level messages to file
        options: {
          file: `${PLATFORM_LOG_DIR}/error`, // File path for rolling logs
          frequency: "daily", // Roll logs daily
          dateFormat: "dd-MMM-yy", // Date format for rolled logs
          extension: ".log", // File extension for rolled logs
          size: "10m", // Maximum size of log file before rolling
          gzip: true, // Gzip the rolled logs
          mkdir: true, // Create the directory if it doesn't exist
        },
      },
    ],
  },
});

export default logger;
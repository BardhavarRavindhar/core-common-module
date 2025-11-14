/**
 * @module Timer
 * 
 * This module provides utility functions for handling time and date related helper methods.
 */

import Time from "../enums/time.enum.js";
import { DateTime } from "luxon";


/**
 * Returns the current date and time in UTC as a JavaScript Date object.
 * @returns {Date} The current UTC date and time.
 */
export const provideCastDate = (dateString) => {
  const utcDate = DateTime.fromFormat(dateString, Time.dateFormat, { zone: 'utc' });
  return utcDate.toJSDate();
};

/**
 * Returns the current date and time in UTC as a JavaScript Date object.
 * @returns {Date} The current UTC date and time.
 */
export const getCurrentUTC = () => {
  return DateTime.utc().toJSDate();
};

/**
 * Returns the current date and time in human readable format.
 * @returns {String} The current UTC date and time in human readable string.
 */
export const getCurrentTimestamp = () => {
  return DateTime.utc().toFormat(Time.humanFormat);
};

/**
 * Formats a given JavaScript Date object into a string based on the slotFormat defined in TimerEnum.
 * @param {Date} jsDate - The JavaScript Date object to format.
 * @returns {string} The formatted date string.
 */
export const parseTimestamp = (jsDate) => {
  return DateTime.fromJSDate(jsDate).toFormat(Time.slotFormat);
};

/**
 * Formats a given JavaScript Date object into a string based on the slotFormat defined in TimerEnum.
 * @param {Date} jsDate - The JavaScript Date object to format.
 * @returns {string} The formatted date string.
 */
export const futureDateUTC = (days = 7) => {
  // Current time in UTC.
  const nowUTC = DateTime.utc();
  // Add specified number of days to get a future date.
  const futureDate = nowUTC.plus({ days: days });
  return futureDate;
};

/**
 * Formats a given JavaScript Date object into a string based on the slotFormat defined in TimerEnum.
 * @param {Date} jsDate - The JavaScript Date object to format.
 * @returns {string} The formatted date string.
 */
export const pastDateUTC = (days = 7) => {
  // Current time in UTC.
  const nowUTC = DateTime.utc();
  // Subtract specified number of days to get a past date.
  const pastDate = nowUTC.minus({ days: days });
  return pastDate;
};

/**
 * Formats a given JavaScript Date object into a string based on the slotFormat defined in TimerEnum.
 * @param {Date} jsDate - The JavaScript Date object to format.
 * @returns {string} The formatted date string.
 */
export const getTimeAgo = (utcDate) => {
  // Parse the date from UTC (assuming ISO string)
  const agoTime = DateTime.fromISO(utcDate, { zone: 'utc' });
  // Convert to a human-readable relative string (e.g., "4 days ago")
  return agoTime.toRelative();
};

/**
 * Formats a given JavaScript Date object into a string based on the slotFormat defined in TimerEnum.
 * @param {Date} jsDate - The JavaScript Date object to format.
 * @returns {string} The formatted date string.
 */
export const getCalenderAgo = (utcDate) => {
  // Parse the date from UTC (assuming ISO string)
  const agoTime = DateTime.fromISO(utcDate, { zone: 'utc' });
  // Convert to a human-readable relative string (e.g., "4 days ago")
  return agoTime.toRelativeCalendar();
};

/**
 * Formats a given JavaScript Date object into a string based on the slotFormat defined in TimerEnum.
 * @param {Date} jsDate - The JavaScript Date object to format.
 * @returns {string} The formatted date string.
 */
export const currentHumanTimestamp = () => {
  // Parse the date from UTC (assuming ISO string)
  const localTimestamp = DateTime.local();
  // Convert to a human-readable relative string (e.g., "Mar 06, 2025 At 4:27 AM")
  return localTimestamp.toFormat(Time.humanLocalFormat);
};

/**
 * Converts a given JavaScript Date object to a human-readable relative time string in a specified timezone.
 * @param {Date} JSDate - The JavaScript Date object.
 * @param {string} timezone - The timezone to convert to (default is "Asia/Kolkata").
 * @returns {string} The human-readable relative time string.
 */
export const getLocalCalenderAgo = (JSDate, timezone = "Asia/Kolkata") => {
  const timestamp = DateTime.fromJSDate(JSDate, { zone: "utc" });
  const localTimestamp = timestamp.setZone(timezone);
  const humanTimestamp = localTimestamp.toRelative({ base: DateTime.now().setZone(timezone) });
  return humanTimestamp;
};

/**
 * Checks if a given date string has an allowed date format.
 * @param {string} dateString - The date string to check.
 * @returns {boolean} True if the date string has an allowed format, false otherwise.
 */
export const hasAllowedDateFormat = (dateString) => {
  // Parse the date string using the specified format.
  const date = DateTime.fromFormat(dateString, Time.dateFormat);
  // Check if the parsed date is valid.
  return date.isValid;
}

/**
 * Returns the current epoch time in seconds.
 * @returns {number} The current epoch time in seconds.
 */
export const getEpocTime = () => {
  const epoc = Math.floor(DateTime.now().toSeconds());
  return epoc;
}

/**
 * Validates if the interval between two dates is correct.
 * @param {string} startDateStr - The start date string (format "dd-MM-yyyy").
 * @param {string} endDateStr - The end date string (format "dd-MM-yyyy").
 * @returns {boolean} True if the interval is valid, false otherwise.
 */
export const validateDatesInterval = (startDateStr, endDateStr, interval = 0) => {
  let flag = true;
  const startDate = DateTime.fromFormat(startDateStr, Time.dateFormat);
  const endDate = DateTime.fromFormat(endDateStr, Time.dateFormat);

  // Check if startDate is greater than endDate
  if (endDate <= startDate.plus({ days: interval })) {
    flag = false;
  }

  return flag;
};


/**
 * @method formatJsDate
 * The function parses the provided date strings using a defined date format
 * 
 * @param {Date} isoDate - The JavaScript Date object to format.
 * @param {string|null} formatString - The desired format string (e.g., "yyyy LLL dd").
 */
export const formatJsDate = (isoDate, dateString = null) => {
  const date = DateTime.fromJSDate(isoDate);

  if (formatString && typeof formatString === "string") {
    return date.toFormat(dateString);
  }
  return date;
};

/**
 * @method mediaStorageDatePath
 * The function provide yeay/month/day

 */
export const mediaStorageDatePath = () => {
  const date = DateTime.now();
  const year = date.toFormat('yyyy');
  // Using abbreviated month name (e.g., "Jan", "Feb", etc.) in lowercase
  const month = date.toFormat('LLL').toLowerCase();
  const day = date.toFormat('dd');
  const mediaPath = `${year}/${month}/${day}`;
  return mediaPath;
};
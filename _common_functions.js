/**
* -----------------------------------------------------------------
* _common_functions.js
* Chevra Kadisha Shifts Scheduler
* Common functions for Google Apps Script (suitable for Google Forms/Sheets integrations)
* -----------------------------------------------------------------
* _common_functions.js
 * Version: 1.0.1
 * Last updated: 2025-10-30
 * 
 * CHANGELOG v1.0.1:
 *   - Added enhanced error handling and logging to addToken.
 *   - Improved prevalidation and update detection logic in isFormUpdated.
 *   - Enhanced logging logic in logQCVars_.
 *   - Added formattedDateAndTime for consistent date formatting.
 *
 * Utility functions for Google Apps Script (suitable for Google Forms/Sheets integrations)
 * -----------------------------------------------------------------
 */

/**
 * Adds a unique token value (UUID) to the specified column in the row that triggered the event.
 * Only works if columnNumber is provided.
 * Logs success or detailed error for debugging.
 * 
 * @function
 * @param {Object} e - The event data object from a Google Sheets trigger.
 * @param {number} columnNumber - The target column number to receive the token.
 */
function addToken(e, columnNumber) {
  if (columnNumber) {
    try {
      var sheet = e.range.getSheet();
      var row = e.range.getRow();
      var uuid = Utilities.getUuid();
      sheet.getRange(row, columnNumber).setValue(uuid);
      Logger.log('Token added successfully for row: ' + row + ' column:' + columnNumber);
    } catch (error) {
      // Stores detailed information for easier debugging
      Logger.log('addToken failed for row: ' + (e && e.range ? e.range.getRow() : 'unknown') + ', error: ' + error.toString());
    }
    Logger.log('addToken failed no column provided ');
  }
}

/**
 * Determines whether a form submission/event represents an "update" condition.
 * Mainly for detecting race conditions or partially completed data.
 * 
 * @function
 * @param {Object} eventData - Object containing submissionDate and email keys at minimum.
 * @returns {boolean} - True if an update is detected, false otherwise.
 */
function isFormUpdated(eventData) {
  let formUpdated = false;

  // Validate required fields for prevalidation
  if (!eventData || !eventData.submissionDate || !eventData.email) {
    Logger.log('Error: Missing required event data fields for checking updates');
    return false;
  }

  // Check for update race condition
  if (eventData.submissionDate !== "" && eventData.email === "") {
    formUpdated = true;
  }

  return formUpdated;
}

/**
 * Quality Control Logger: Logs key/value pairs from an object for audit/debugging purposes.
 * The log occurs only if the global constant DEBUG is true.
 * 
 * @function
 * @param {string} context - Descriptive context for the log entry.
 * @param {Object} varsObject - Key/value pairs to be logged.
 */
function logQCVars_(context, varsObject) {
  // --- QA CHECK ---
  if (typeof DEBUG === 'undefined' || DEBUG === false) {
    return;
  }
  // --- END QA CHECK ---

  Logger.log(`--- QC LOG: ${context} ---`);
  
  if (typeof varsObject !== 'object' || varsObject === null) {
    Logger.log(`Invalid varsObject: ${varsObject}`);
    Logger.log(`--- END QC LOG: ${context} ---`);
    return;
  }

  for (const key in varsObject) {
    if (Object.prototype.hasOwnProperty.call(varsObject, key)) {
      const value = varsObject[key];
      if (typeof value === 'object' && value !== null) {
        try {
          Logger.log(`[${key}]: ${JSON.stringify(value)}`);
        } catch (e) {
          Logger.log(`[${key}] (Object): ${value.toString()}`);
        }
      } else {
        Logger.log(`[${key}]: ${value}`);
      }
    }
  }
  Logger.log(`--- END QC LOG: ${context} ---`);
}

/**
 * Returns a formatted English-language string for the supplied Date object.
 * Throws an error if input is not a valid Date.
 * 
 * @function
 * @param {Date} inputDate - JavaScript Date object.
 * @returns {string} - Date formatted as "Weekday, Month Day, Year at HH:MM AM/PM TZ".
 */
function formattedDateAndTime(inputDate) {
  if (!(inputDate instanceof Date) || isNaN(inputDate)) {
    throw new Error("Invalid date");
  }

  const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short' };

  const dateStr = inputDate.toLocaleDateString('en-US', optionsDate);
  const timeStr = inputDate.toLocaleTimeString('en-US', optionsTime);

  return `${dateStr} at ${timeStr}`;
}

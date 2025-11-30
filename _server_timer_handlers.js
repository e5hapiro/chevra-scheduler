/**
* -----------------------------------------------------------------
* server_timer_functions.js
* Chevra Kadisha Shifts Scheduler
* Timed functions are called by a server side timer and run as batch jobs performing time sensitive functions
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
 * Triggers the updates for the shifts and event map.
 * Depends on the script properties being set.
 * @returns {void}
 */

function triggeredFunction() {
  bckLib.updateShiftsAndEventMap(setConfigProperties());
}


/**
 * Sets script properties
 * @returns {void}
 */
function setConfigProperties() {

  // For final deployment - Hardcode the script URL since I cannot rely upon getUrl which is buggy
  const webAppUrl = "https://script.google.com/macros/s/AKfycbzoJZbDMqTQEG2PHuWeNVUNca8-S31igyjMa9BdQgmXbgTUIJIRTq2wQQJZdgPMlLwN/exec";
  //const webAppUrl = ScriptApp.getService().getUrl(); 
  console.log("webAppUrl: "+ webAppUrl);
 
 // scriptProperties.setProperty('SCRIPT_URL', webAppUrl);  
  const ss = getActiveSpreadsheetId();

  // hardcode the names of the sheet databases
  const sheetInputs = {
    DEBUG: DEBUG,
    SCRIPT_URL: webAppUrl,
    SPREADSHEET_ID: ss,
    EVENT_FORM_RESPONSES: 'Form Responses 1',
    SHIFTS_MASTER_SHEET: 'Shifts Master',
    VOLUNTEER_LIST_SHEET: 'Volunteer Shifts',
    GUESTS_SHEET: 'Guests',
    MEMBERS_SHEET: 'Members',
    LOCATIONS_SHEET: 'Locations',
    EVENT_MAP: 'Event Map',
    ARCHIVE_EVENT_MAP: 'Archive Event Map',
    TOKEN_COLUMN_NUMBER: 12
  };

  return sheetInputs;

}



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
 * Quality Control Logger: Logs a set of variables with a context message.
 * ONLY logs if the global constant DEBUG is set to true.
 *
 * @param {string} context - A message describing where in the code this is being called.
 * @param {Object} varsObject - An object where keys are variable names and values are the variables.
 */
function logQCVars_(context, varsObject) {
  // --- QA CHECK ---
  if (typeof DEBUG === 'undefined' || DEBUG === false) {
    return;
  }
  // --- END QA CHECK ---

  console.log(`--- QC LOG: ${context} ---`);
  
  if (typeof varsObject !== 'object' || varsObject === null) {
    console.log(`Invalid varsObject: ${varsObject}`);
    console.log(`--- END QC LOG: ${context} ---`);
    return;
  }

  for (const key in varsObject) {
    if (Object.prototype.hasOwnProperty.call(varsObject, key)) {
      const value = varsObject[key];
      
      if (typeof value === 'object' && value !== null) {
        try {
          console.log(`[${key}]: ${JSON.stringify(value)}`);
        } catch (e) {
          console.log(`[${key}] (Object): ${value.toString()}`);
        }
      } else {
        console.log(`[${key}]: ${value}`);
      }
    }
  }
  console.log(`--- END QC LOG: ${context} ---`);
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


/**
 * Aggressively cleans a string for robust token comparisons.
 *  - Removes all whitespace (space, tabs, newlines)
 *  - Removes invisible and Unicode control characters
 *  - Removes leading/trailing quotes, if present
 *  - Converts to lowercase (optional, for case-insensitive matching)
 *
 * @param {string} str
 * @param {boolean} [toLower] Should convert to lowercase? (Default false)
 * @returns {string}
 */
function normalizeToken(str, toLower) {
  if (typeof str !== 'string') str = String(str);

  // Remove leading/trailing whitespace, quotes, ALL whitespace, & invisible characters
  let cleaned = str
    .replace(/^["']+|["']+$/g, '')        // Remove leading/trailing quotes if present
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width/unicode invisible chars
    .replace(/\s+/g, '')                   // Remove ALL whitespace (space, tabs, newlines)
    .replace(/[\r\n\t]/g, '');             // Remove specific control chars

  if (toLower) cleaned = cleaned.toLowerCase();
  return cleaned;
}


/**
 * Safely opens the spreadsheet.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} The spreadsheet object.
 * @private
 */
function getSpreadsheet_(SPREADSHEET_ID) {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}


function getActiveSpreadsheetId() {
  // 1. Get the Spreadsheet object for the active file
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // 2. Get the ID from that Spreadsheet object
  var spreadsheetId = spreadsheet.getId();
  
  // Log the ID for debugging, or return it
  Logger.log('Active Spreadsheet ID: ' + spreadsheetId); 
  
  return spreadsheetId;
}

// Format a date string from epoch milliseconds to "Day Mon Date Year"
function formatShortDate(epochTime) {
  const date = new Date(epochTime);
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.getMonth() + 1;
  const dateOfMonth = date.getDate();
  const year = date.getFullYear();
  return `${dayName} ${month}/${dateOfMonth}/${year}`;
}





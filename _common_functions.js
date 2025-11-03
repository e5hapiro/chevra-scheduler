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
 * Triggers the updates for the shifts and event map.
 * Depends on the script properties being set.
 * @returns {void}
 */

function triggeredFunction() {
  bckLib.updateShiftsAndEventMap();
}


/**
 * Sets script properties
 * Needs to be run a single time 
 * @returns {void}
 */
function setConfigProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();
  
  scriptProperties.setProperty('DEBUG', 'true');
  
  const addressConfig = {
    'Crist Mortuary': '3395 Penrose Pl, Boulder, CO 80301',
    'Greenwood & Myers Mortuary': '2969 Baseline Road, Boulder, CO 80303'
  };
  scriptProperties.setProperty('ADDRESS_CONFIG', JSON.stringify(addressConfig));  
  
  const sheetInputs = {
    SPREADSHEET_ID: '1cCouQRRpEN0nUhN45m14_z3oaONo7HHgwyfYDkcu2mw',
    EVENT_FORM_RESPONSES: 'Form Responses 1',
    SHIFTS_MASTER_SHEET: 'Shifts Master',
    GUESTS_SHEET: 'Guests',
    MEMBERS_SHEET: 'Members',
    EVENT_MAP: 'Event Map',
    ARCHIVE_EVENT_MAP: 'Archive Event Map',
    TOKEN_COLUMN_NUMBER: 12
  };
  scriptProperties.setProperty('SHEET_INPUTS', JSON.stringify(sheetInputs));
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

function getMemberInfoByToken_(token) {

  console.log("Getting getMemberInfoByToken_ " + token);
  
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(MEMBERS_SHEET);
    if (!sheet) throw new Error(`Sheet not found: ${MEMBERS_SHEET}`);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Map header names to indices
    var idx = {};
    headers.forEach(function(h, i) { idx[h] = i; });


    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (normalizeToken(row[idx['Token']]) === normalizeToken(token)) {
        const info = {
          timestamp: row[idx['Timestamp']],
          email: row[idx['Email Address']],
          firstName: row[idx['First Name']],
          lastName: row[idx['Last Name']],
          address: row[idx['Address']],
          city: row[idx['City']],
          state: row[idx['State']],
          zip: row[idx['Zip']],
          phone: row[idx['Phone']],
          canText: row[idx['Can we text you at the above phone number?']],
          shmiraVolunteer: row[idx['Are you interested in volunteering to sit shmira?']],
          taharaVolunteer: row[idx['Are you interested in volunteering to do tahara?']],
          tachrichimVolunteer: row[idx['Are you interested in helping to make tachrichim (no sewing experience needed).']],
          hasSatShmiraBoulder: row[idx['Have you sat shmira with the Boulder Chevra Kadisha before?']],
          shmiraTraining: row[idx['Do you need/want training training for sitting shmira']],
          hasSatShmiraOther: row[idx['Have you sat shmira with another chevra kadisha before.']],
          hasDoneTaharaBoulder: row[idx['Have you participated in a tahara with the Boulder Chevra Kadisha?']],
          taharaTraining: row[idx['Do you need/want training training on tahara?']],
          taharaPreference: row[idx['Preferred way to receive requests for tahara (check all that apply)']],
          sewingMachine: row[idx['Do you have a sewing machine?']],
          affiliation: row[idx['What is your affiliation - The Boulder Chevra Kadisha is a community-wide chevra kadisha. We serve all Jews in Boulder County - affiliated of not. ']],
          synagogue: row[idx['What is the name of your synagogue (if not a local synagogue also include city, state)']],
          agreement: row[idx['By submitting this application, I certify the information is true and accurate and I agree with the terms and conditions of volunteering with the Boulder Chevra Kadisha. ']],
          communicationPreference: row[idx['Preferred way to receive communication (including shmira and tahara notifications) (check all that apply)']],
          hasSatShmiraOtherAgain: row[idx['Have you sat shmira with another chevra kadisha before?']],
          hasDoneTaharaOther: row[idx['Have you participated in a tahara with another chevra kadisha?']],
          notes: row[idx['Is there anything you want us to know about you, your skills or past chevra kadisha experience?']],
          token: row[idx['Token']],
          approvals: row[idx['Approvals']],
          rowIndex: i + 1 // Sheet row (1-based)
        };
        logQCVars_('getMemberInfoByToken_', info);
        return info;
      }
    }
    console.log("Did not find a member with that token");
    return null;
  } catch (e) {
    Logger.log("Error in getMemberInfoByToken_: " + e.toString());
    throw e;
  }
}

function getGuestInfoByToken_(token) {
  console.log("Getting getGuestInfoByToken_ "+token);
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(GUESTS_SHEET);
    if (!sheet) throw new Error(`Sheet not found: ${GUESTS_SHEET}`);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Map header names to indices
    var idx = {};
    headers.forEach(function(h, i) { idx[h] = i; });

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (normalizeToken(row[idx['Token']]) === normalizeToken(token)) {
        const info = {
          timestamp: row[idx['Timestamp']],
          email: row[idx['Email Address']],
          firstName: row[idx['First Name']],
          lastName: row[idx['Last Name']],
          address: row[idx['Address']],
          city: row[idx['City']],
          state: row[idx['State']],
          zip: row[idx['Zip']],
          phone: row[idx['Phone']],
          canText: row[idx['Can we text you at the above phone number?']],
          names: (row[idx['Name of Deceased']] || "")
            .toString()
            .split(',')
            .map(function(n) { return n.trim().toLowerCase(); }),
          relationship: row[idx['Relationship to Deceased']],
          over18: row[idx['Are you over 18 years old?']],
          sitAlone: row[idx["To sit shmira alone with the Boulder Chevra Kadisha, you must be over 18 years old. If you are under 18 years old, you can sit shmira with a Boulder Chevra Kadisha Member or a parent/guardian. If you will sit shmira with a parent or guardian, have them fill out the form. If you would like to be matched up with a Member of the Boulder Chevra Kadisha, you can continue to complete the form."]],
          canSitDuringBusiness: row[idx["Are you able to sit shmira during the mortuary's normal business hours? (Business hours are Monday through Friday 9am - 5pm)"]],
          sitAfterHours: row[idx["To sit shmira alone after business hours of the mortuary, you must be a Boulder Chevra Kadisha Member. If you are not a member and still want to sit shmira and you are only able to sit shmira outside of regular business hours, we can match you with a member. Would you like to discuss sitting shmira with a Boulder Chevra Kadisha Member?"]],
          affiliation: row[idx["What is your affiliation? (The Boulder Chevra Kadisha is a community wide chevra kadisha. We serve all Jews in Boulder County - affiliated of not.)"]],
          synagogue: row[idx['Name, City and State of synagogue.']],
          onMailingList: row[idx['Do you want to be on our mailing list for events and training?']],
          agreement: row[idx['By submitting this application, I certify the information is true and accurate and I agree with the terms and conditions of sitting shmira with the Boulder Chevra Kadisha.']],
          token: row[idx['Token']],
          approvals: row[idx['Approvals']],
          rowIndex: i + 1 // Sheet row (1-based)
        };
        logQCVars_('getGuestInfoByToken_', info);
        return info;
      }
    }
    console.log("Did not find a guest with that token");
    return null;
  } catch (e) {
    Logger.log("Error in getGuestInfoByToken_: " + e.toString());
    throw e;
  }
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
function getSpreadsheet_() {
  if (SPREADSHEET_ID === 'YOUR_GOOGLE_SHEET_ID_HERE') {
    throw new Error("Configuration Error: Please set the SPREADSHEET_ID constant.");
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Looks up the confidential physical address based on the location name (e.g., 'Site A').
 * This function retrieves the secret address stored in ADDRESS_CONFIG.
 * @param {string} locationName The short name (e.g., 'Site A' or 'Site B').
 * @returns {string} The full physical address or a helpful message.
 * @private
 */
function getAddressFromLocationName_(locationName) {
  // Use the locationName to look up the confidential address.
  if (ADDRESS_CONFIG[locationName]) {
    return ADDRESS_CONFIG[locationName];
  }
  
  // If the location is not configured (e.g., 'Virtual Shift', 'Other'), return the name.
  return locationName; 
}


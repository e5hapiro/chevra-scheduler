/**
* -----------------------------------------------------------------
* _webAppHandler.js
* Chevra Kadisha Shifts Scheduler
* Web App Handler
* -----------------------------------------------------------------
* _webAppHandler.js
 * Version: 1.0.1
 * Last updated: 2025-10-30
 * 
 * CHANGELOG v1.0.1:
 *   - Initial implementation of getCurrentEventInfo_.
 *   - Added logging and error handling.
 *   - Added event information retrieval.
 *   - Added shift information retrieval.
 *   - Added email sending.
 *   - Added error handling and logging.
 *   - Added logging and error handling.
 * Web App Handler
 * -----------------------------------------------------------------
 */

/**
 * Retrieves the current event information (Deceased Name, Address/Location, Bio) 
 * from the latest Form Responses 1 submission.
 * @returns {object|null} The current event details.
 * @private
 */
/**
 * Retrieves the current event information (Deceased Name, Address/Location, Bio) 
 * from the latest Form Responses 1 submission.
 * @returns {object|null} The current event details.
 * @private
 */

function getCurrentEventInfo_() {
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(EVENT_FORM_RESPONSES);
    
    // Check if the sheet exists and has at least one data row (header + 1)
    if (!sheet || sheet.getLastRow() < 2) {
      Logger.log("Form Responses sheet not ready or empty.");
      return null;
    } 

    // Get the latest submitted row (assumed to be the last row)
    const lastRow = sheet.getLastRow();
    // Read the range of the last row starting from column A (index 1)
    const row = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Form Responses 1 data indices (0-based):
    // Index 3: Location Name (Col D)
    // Index 8: Deceased Name (Col C)
    // Index 11: Personal Information (Col I)
    
    const locationName = String(row[3] || 'Location Not Specified');
    
    return {
      eventName: String(row[8] || 'Deceased Name Not Available'), 
      // *** FIX APPLIED HERE: Look up the full address from the location name ***
      address: getAddressFromLocationName_(locationName), 
      bio: String(row[11] || 'No further personal details provided.') 
    };
    
  } catch (e) {
    Logger.log("Error in getCurrentEventInfo_: " + e.toString());
    return null;
  }
}


/**
 * Retrieves shift information based on the shift ID from the master sheet.
 * @param {string} shiftId The unique shift ID.
 * @returns {object|null} Object containing shift details, or null if not found.
 * @private
 */
/**
 * Retrieves shift information based on the shift ID from the master sheet.
 * @param {string} shiftId The unique shift ID.
 * @returns {object|null} Object containing shift details, or null if not found.
 * @private
 */
function getShiftDetailsById_(shiftId) {
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHIFTS_MASTER_SHEET);
    if (!sheet) throw new Error(`Sheet not found: ${SHIFTS_MASTER_SHEET}`);

    const data = sheet.getDataRange().getValues();
    // Start at row 1 to skip headers
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[SHIFT_ID_COL]) === shiftId) {
        return {
          eventName: String(row[SHIFT_EVENT_NAME_COL]),
          eventLocation: String(row[SHIFT_SHIFT_LOCATION_COL]), 
          eventDate: String(row[SHIFT_EVENT_DATE_COL]),
          shiftTime: String(row[SHIFT_SHIFT_TIME_COL]),
        };
      }
    }
    return null;
  } catch (e) {
    Logger.log("Error in getShiftDetailsById_: " + e.toString());
    throw e;
  }
}

// -------------------------------------------------------------------
// --- EMAIL FUNCTIONALITY UPDATED ---
// -------------------------------------------------------------------

/**
 * Sends a confirmation email to the volunteer.
 * @param {string} recipientEmail - The volunteer's email address.
 * @param {object} shift - Object containing shift details (eventName, eventLocation, eventDate, shiftTime).
 * @param {string} actionType - 'Signup' or 'Drop'.
 * @param {string} volunteerName - The name of the volunteer.
 * @param {string} volunteerUrl - The volunteer's unique portal URL.
 */
/**
 * Sends a confirmation email to the volunteer.
 * @param {string} recipientEmail - The volunteer's email address.
 * @param {object} shift - Object containing shift details (eventName, eventLocation, eventDate, shiftTime).
 * @param {string} actionType - 'Signup' or 'Drop'.
 * @param {string} volunteerName - The name of the volunteer.
 * @param {string} volunteerUrl - The volunteer's unique portal URL.
 */
function sendShiftEmail(recipientEmail, shift, actionType, volunteerName, volunteerUrl) {
  const subject = `Shift ${actionType} Confirmation: ${shift.eventName}`;
  
  // Look up the full address for the email body
  const fullAddress = getAddressFromLocationName_(shift.eventLocation);
  
  const body = `
    Dear ${volunteerName},

    This is an automatic confirmation that your request to ${actionType.toLowerCase()} the following shift has been processed successfully:

    Shift Details:
    - Event: ${shift.eventName}
    - Location: ${shift.eventLocation}
    - Address: ${fullAddress}
    - Date: ${shift.eventDate}
    - Time: ${shift.shiftTime}

    If you need to cancel or change your confirmation. Go to Your Volunteer Portal Link: ${volunteerUrl}. Remember, this link is unique to you. Please do not share it.
    
    Thank you for providing this mitzvah.

    
  `;

  try {
    // Check if the recipient email is valid (basic check)
    if (!recipientEmail || !String(recipientEmail).includes('@')) {
       Logger.log(`Skipping email: Invalid recipient email address: ${recipientEmail}`);
       return;
    }
    
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: body
    });
    Logger.log(`Email sent successfully for ${actionType} to ${recipientEmail}`);
  } catch (e) {
    Logger.log(`ERROR sending email for ${actionType}: ${e.toString()}`);
  }
}

/**
 * MAIN WEB APP FUNCTIONS (Called by google.script.run)
 * -------------------------------------------------------------------
 */

function getShiftsAndSignups(token) {
  try {
    Logger.log("--- START getShiftsAndSignups (REAL DATA) ---");
    const volunteerInfo = getVolunteerInfoByToken_(token);

    if (!volunteerInfo) {
      return { error: "Invalid or expired authorization token." };
    }
    
    // 1. Get Shifts Master Data
    const ss = getSpreadsheet_();
    const shiftSheet = ss.getSheetByName(SHIFTS_MASTER_SHEET);
    if (!shiftSheet) throw new Error(`Sheet not found: ${SHIFTS_MASTER_SHEET}`);

    const shiftData = shiftSheet.getDataRange().getValues();
    const allShifts = [];
    const now = new Date().getTime(); // Get current epoch time (milliseconds)

    // Process shift rows (starting from 1 to skip headers)
    for (let i = 1; i < shiftData.length; i++) {
      const row = shiftData[i];
      
      const shiftStartTimeEpoch = Number(row[SHIFT_START_EPOCH_COL]);
      
      // --- SERVER-SIDE FILTER: ONLY INCLUDE FUTURE SHIFTS ---
      // Check if the shift has already started (Epoch time <= current time)
      if (shiftStartTimeEpoch <= now) {
          continue; 
      }
      // ------------------------------------------------------
      
      // Explicitly cast data types to prevent serialization errors
      allShifts.push({
        id: String(row[SHIFT_ID_COL]), // Must be string
        eventName: String(row[SHIFT_EVENT_NAME_COL]), // Deceased Name
        location: String(row[SHIFT_SHIFT_LOCATION_COL]), 
        eventDate: String(row[SHIFT_EVENT_DATE_COL]),
        shiftTime: String(row[SHIFT_SHIFT_TIME_COL]),
        maxVolunteers: Number(row[SHIFT_MAX_VOL_COL]), // Must be number
        currentVolunteers: Number(row[SHIFT_CUR_VOL_COL]), // Must be number
        startTimeEpoch: shiftStartTimeEpoch // Must be number (epoch time)
      });
    }

    // 2. Get Volunteer Signups Data
    const signupSheet = ss.getSheetByName(SIGNUPS_SHEET);
    if (!signupSheet) throw new Error(`Sheet not found: ${SIGNUPS_SHEET}`);

    const signupData = signupSheet.getDataRange().getValues();
    const signedUpShiftIds = [];

    // Process signup rows (starting from 1 to skip headers)
    for (let i = 1; i < signupData.length; i++) {
      const row = signupData[i];
      if (row[SIGNUP_TOKEN_COL] === token) {
        // Ensure Shift ID is a string
        signedUpShiftIds.push(String(row[SIGNUP_SHIFT_ID_COL]));
      }
    }

    Logger.log(`Found ${allShifts.length} FUTURE shifts and ${signedUpShiftIds.length} signups for ${volunteerInfo.name}.`);

    return {
      allShifts: allShifts,
      signedUpShiftIds: signedUpShiftIds,
      currentEvent: getCurrentEventInfo_() // <-- This now includes the full address
    };

  } catch (e) {
    Logger.log("EXECUTION ERROR in getShiftsAndSignups: " + e.toString());
    return { error: "Server Error: Could not load data. Check script logs for details. Error: " + e.message };
  }
}

/**
 * Handles the logic for a volunteer signing up for a shift.
 * @param {string} shiftId The ID of the shift.
 * @param {string} token The volunteer's security token.
 * @returns {boolean|string} True on success, or an error string.
 */
function handleShiftSignup(shiftId, token) {
  const LOCK_ID = "SHIFT_LOCK_" + shiftId;
  const lock = LockService.getScriptLock();
  
  // Wait up to 30 seconds for the lock
  lock.waitLock(30000); 

  try {
    const volunteerInfo = getVolunteerInfoByToken_(token);
    if (!volunteerInfo) {
        Logger.log("handleShiftSignup failed: Invalid token.");
        return "Invalid or expired authorization token.";
    }

    const ss = getSpreadsheet_();
    const shiftSheet = ss.getSheetByName(SHIFTS_MASTER_SHEET);
    const signupSheet = ss.getSheetByName(SIGNUPS_SHEET);
    
    // --- 1. Check Capacity and Existing Signup ---
    const shiftData = shiftSheet.getDataRange().getValues();
    let shiftRowIndex = -1;
    let shiftRow = null;

    for (let i = 1; i < shiftData.length; i++) {
      if (String(shiftData[i][SHIFT_ID_COL]) === shiftId) {
        shiftRowIndex = i + 1; // 1-based index
        shiftRow = shiftData[i];
        break;
      }
    }

    if (!shiftRow) {
      Logger.log(`handleShiftSignup failed: Shift ID ${shiftId} not found.`);
      return "Shift ID not found.";
    }

    const currentVolunteers = Number(shiftRow[SHIFT_CUR_VOL_COL]);
    const maxVolunteers = Number(shiftRow[SHIFT_MAX_VOL_COL]);

    if (currentVolunteers >= maxVolunteers) {
      Logger.log(`handleShiftSignup failed: Shift ${shiftId} is full (Max: ${maxVolunteers}).`);
      return "Shift is already full.";
    }

    const signupData = signupSheet.getDataRange().getValues();
    for (let i = 1; i < signupData.length; i++) {
      if (String(signupData[i][SIGNUP_SHIFT_ID_COL]) === shiftId && signupData[i][SIGNUP_TOKEN_COL] === token) {
        Logger.log(`handleShiftSignup failed: Volunteer already signed up for ${shiftId}.`);
        return "You are already signed up for this shift."; 
      }
    }

    // --- 2. Record Signup ---
    // Append new row to Volunteer Signups sheet
    signupSheet.appendRow([
      new Date(),       // Timestamp
      shiftId,          // Shift ID
      token,            // Volunteer Token
      volunteerInfo.name// Volunteer Name
    ]);

    // --- 3. Update Shift Capacity ---
    // Increment the Current Volunteers count (Column F, index 5)
    shiftSheet.getRange(shiftRowIndex, SHIFT_CUR_VOL_COL + 1).setValue(currentVolunteers + 1);

    Logger.log(`Successful signup: ${volunteerInfo.name} for shift ${shiftId}.`);
    
    // -------------------------------------------------------------------
    // --- EMAIL CONFIRMATION ---
    // -------------------------------------------------------------------
    const shiftDetails = getShiftDetailsById_(shiftId);
    if (shiftDetails) {
        // Passing volunteerInfo.url to the email function
        sendShiftEmail(volunteerInfo.email, shiftDetails, 'Signup', volunteerInfo.name, volunteerInfo.url);
    }
    // -------------------------------------------------------------------

    return true;

  } catch (e) {
    // *** Crucial Logging ***
    Logger.log("EXECUTION ERROR in handleShiftSignup: " + e.toString());
    return "An unexpected server error occurred during signup.";
  } finally {
    // Must ensure lock is released
    lock.releaseLock();
  }
}

/**
 * Handles the logic for a volunteer dropping a shift.
 * @param {string} shiftId The ID of the shift.
 * @param {string} token The volunteer's security token.
 * @returns {boolean|string} True on success, or an error string.
 */
function handleShiftDrop(shiftId, token) {
  const LOCK_ID = "SHIFT_LOCK_" + shiftId;
  const lock = LockService.getScriptLock();
  
  // Wait up to 30 seconds for the lock
  lock.waitLock(30000); 

  try {
    const volunteerInfo = getVolunteerInfoByToken_(token);
    if (!volunteerInfo) {
        Logger.log("handleShiftDrop failed: Invalid token.");
        return "Invalid or expired authorization token.";
    }

    const ss = getSpreadsheet_();
    const shiftSheet = ss.getSheetByName(SHIFTS_MASTER_SHEET);
    const signupSheet = ss.getSheetByName(SIGNUPS_SHEET);

    // --- 1. Find and Delete Signup Row ---
    const signupData = signupSheet.getDataRange().getValues();
    let signupRowIndex = -1;
    
    // Need shift details *before* deleting the signup row for the email
    const shiftDetails = getShiftDetailsById_(shiftId); 

    for (let i = 1; i < signupData.length; i++) {
      // Must cast shift ID to string for reliable comparison
      if (String(signupData[i][SIGNUP_SHIFT_ID_COL]) === shiftId && signupData[i][SIGNUP_TOKEN_COL] === token) {
        signupRowIndex = i + 1; // 1-based index
        break;
      }
    }

    if (signupRowIndex === -1) {
      Logger.log(`handleShiftDrop failed: Signup not found for ${volunteerInfo.name} on shift ${shiftId}.`);
      return "You were not signed up for this shift."; 
    }
    
    signupSheet.deleteRow(signupRowIndex);

    // --- 2. Update Shift Capacity ---
    const shiftData = shiftSheet.getDataRange().getValues();
    let shiftRowIndex = -1;
    let currentVolunteers = 0;

    for (let i = 1; i < shiftData.length; i++) {
      // Must cast shift ID to string for reliable comparison
      if (String(shiftData[i][SHIFT_ID_COL]) === shiftId) {
        shiftRowIndex = i + 1; // 1-based index
        currentVolunteers = Number(shiftData[i][SHIFT_CUR_VOL_COL]);
        break;
      }
    }

    if (shiftRowIndex === -1) {
      Logger.log(`handleShiftDrop warning: Shift ID ${shiftId} not found in master sheet, but signup was deleted.`);
      // Still return true because the signup record was successfully removed.
      return true; 
    }

    // Decrement the Current Volunteers count (Column F, index 5)
    const newCount = Math.max(0, currentVolunteers - 1);
    shiftSheet.getRange(shiftRowIndex, SHIFT_CUR_VOL_COL + 1).setValue(newCount);

    Logger.log(`Successful drop: ${volunteerInfo.name} from shift ${shiftId}. New count: ${newCount}`);
    
    // -------------------------------------------------------------------
    // --- EMAIL CONFIRMATION ---
    // -------------------------------------------------------------------
    if (shiftDetails) {
        // Passing volunteerInfo.url to the email function
        sendShiftEmail(volunteerInfo.email, shiftDetails, 'Drop', volunteerInfo.name, volunteerInfo.url);
    }
    // -------------------------------------------------------------------

    return true;

  } catch (e) {
    // *** Crucial Logging ***
    Logger.log("EXECUTION ERROR in handleShiftDrop: " + e.toString());
    return "An unexpected server error occurred during shift drop.";
  } finally {
    // Must ensure lock is released
    lock.releaseLock();
  }
}

/**
 * Handles the logic for a volunteer signing up for multiple shifts in a batch.
 * It iterates through the list of shift IDs and calls the single sign-up function.
 * @param {Array<string>} shiftIds - An array of Shift IDs to sign up for.
 * @param {string} token - The volunteer's security token.
 * @returns {boolean|string} True on success for ALL shifts, or a string error message if any fail.
 */
function handleBulkShiftSignup(shiftIds, token) {
  Logger.log(`Starting bulk signup for ${shiftIds.length} shifts.`);
  
  const failedShifts = [];
  
  if (!token) {
      Logger.log("handleBulkShiftSignup failed: Invalid token.");
      return "Authentication error: Invalid volunteer token.";
  }
  
  let successCount = 0;
  
  // Iterate through the list of selected shift IDs
  for (const shiftId of shiftIds) {
    // Call the existing single sign-up function. 
    // It returns true on success, or an error string on failure.
    const result = handleShiftSignup(shiftId, token);
    
    if (result === true) {
      successCount++;
    } else {
      // Collect error messages/failed IDs
      failedShifts.push(shiftId);
    }
  }
  
  if (failedShifts.length === 0) {
      Logger.log(`Bulk signup successful for all ${shiftIds.length} shifts.`);
      return true; 
  }
  
  if (successCount > 0) {
      Logger.log(`Bulk signup completed with ${failedShifts.length} failures out of ${shiftIds.length}.`);
      return `Successfully signed up for ${successCount} shifts. ${failedShifts.length} shifts failed (e.g., full capacity or already signed up).`;
  }

  Logger.log(`Bulk signup failed for all ${shiftIds.length} shifts.`);
  return `Warning: Sign up failed for all ${shiftIds.length} selected shifts. Please check the 'Available Shifts' tab for details.`;
}

/**
 * Generates unique tokens and personalized URLs for volunteers who don't have them.
 * This function should be run manually once by the admin.
 */
function generateVolunteerTokens() {
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(VOLUNTEER_LIST_SHEET);
    if (!sheet) throw new Error(`Sheet not found: ${VOLUNTEER_LIST_SHEET}`);
    
    // The Web App URL is dynamically retrieved at runtime.
    const webAppUrl = ScriptApp.getService().getUrl(); 
    Logger.log("Web App URL detected: " + webAppUrl);

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    let updates = [];

    // Skip the header row (i=0)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      let token = row[VOL_TOKEN_COL];
      
      // If token is missing, generate one
      if (!token || token === '') {
        token = Utilities.getUuid();
        row[VOL_TOKEN_COL] = token;
      }

      // Always regenerate the URL to ensure it uses the latest deployment URL
      // NOTE: We consistently use 't' here to maintain uniformity for the generator.
      const personalizedUrl = `${webAppUrl}?t=${token}`;
      row[VOL_URL_COL] = personalizedUrl;

      updates.push(row);
    }

    // Write all updated values back to the sheet, including the header row
    // We concatenate the header (values[0]) with the updated rows
    const updatedValues = [values[0]].concat(updates);
    dataRange.setValues(updatedValues);
    
    Logger.log(`Successfully updated tokens and URLs for ${updates.length} volunteers.`);

  } catch (e) {
    Logger.log("FATAL ERROR in generateVolunteerTokens: " + e.toString());
  }
}

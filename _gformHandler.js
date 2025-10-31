/**
* -----------------------------------------------------------------
* _gformHandler.js
* Chevra Kadisha Shifts Scheduler
* Google Form Handler
* -----------------------------------------------------------------
* _gformHandler.js
 * Version: 1.0.1
 * Last updated: 2025-10-30
 * 
 * CHANGELOG v1.0.1:
 *   - Initial implementation of processFormSubmit.
 *   - Added logging and error handling.
 *   - Added token generation and addition.
 *   - Added form updated detection.
 *   - Added date parsing and validation.
 *   - Added shift creation.
 *   - Added shift synchronization to the Shifts Master sheet.
 *   - Added notification email sending.
 *   - Added volunteer contact information retrieval.
 *   - Added error handling and logging.
 *   - Added logging and error handling.
 * Google Form Handler
 * -----------------------------------------------------------------
 */




/**
 * Handles the 'On form submit' trigger from the administrator's event form.
 * This function processes the form response and updates the Shifts Master sheet.
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e The form submit event object.
 */
function processFormSubmit(e) {
  let eventData = {}; // Use 'let' if you plan to re-assign, but we'll be adding properties, so 'const' is better.

  Logger.log("Processing form submit");

  addToken(e, TOKEN_COLUMN_NUMBER)

  Logger.log("Token added");

  try {
    const rawValues = e.values;

    // --- Create a single data object ---
    eventData = {
      rawValues: rawValues,
      deceasedName: rawValues[2],
      locationName: rawValues[3],
      rawStartDate: rawValues[4],
      rawStartTime: rawValues[5],
      rawEndDate: rawValues[6],
      rawEndTime: rawValues[7],
      personalInfo: rawValues[8],
      pronoun: rawValues[9],
      metOrMeita: rawValues[10]
    };
    
    // --- QC LOG 1: After initial extraction ---
    // Log the entire data object
    logQCVars_("After Variable Extraction", eventData);

    // -------------------------------------------------------------------
    // --- Handle Updated Form scenario ---
    // -------------------------------------------------------------------
    let formUpdated = isFormUpdated(eventData);

    // If the form is updated current not proceeding with any change
    if (formUpdated) {
        return
    }

    // Combine Date and Time fields to create proper Date objects
    eventData.startDate = new Date(`${eventData.rawStartDate} ${eventData.rawStartTime}`);
    eventData.endDate = new Date(`${eventData.rawEndDate} ${eventData.rawEndTime}`);

    // --- QC LOG 2: After Date Parsing ---
    // This log is for specific validation checks
    logQCVars_("After Date Parsing", {
      rawStartDate_and_Time: `${eventData.rawStartDate} ${eventData.rawStartTime}`,
      rawEndDate_and_Time: `${eventData.rawEndDate} ${eventData.rawEndTime}`,
      parsed_startDate: eventData.startDate,
      parsed_endDate: eventData.endDate,
      isStartDateInvalid: isNaN(eventData.startDate.getTime()),
      isEndDateInvalid: isNaN(eventData.endDate.getTime()),
      isOrderInvalid: eventData.startDate >= eventData.endDate
    });

    // --- Validate the new Date objects ---
    if (isNaN(eventData.startDate.getTime()) || isNaN(eventData.endDate.getTime()) || eventData.startDate >= eventData.endDate) {
        Logger.log(`Invalid date/time received. Start: ${eventData.startDate}, End: ${eventData.endDate}`);
        return;
    }

    // Create shifts and update master sheet
    // Pass the object properties to the next function
    const allNewShifts = createHourlyShifts_(
      eventData
    );
    
    
    // --- QC LOG 3: After Shift Creation ---
    logQCVars_("After Shift Creation", {
      allNewShifts_Count: allNewShifts ? allNewShifts.length : 'null or 0',
      allNewShifts_Sample: allNewShifts ? allNewShifts.slice(0, 2) : 'N/A' 
    });

    syncShiftsToSheet(allNewShifts);
    
    // --- QC LOG 5: Process Complete ---
    logQCVars_("Process Complete", { status: "Success" });

  } catch (e) {
    Logger.log("Error in processFormSubmit: " + e.toString());
    
    // --- QC LOG 6: On Error ---
    // Log the error AND the state of the data object when it failed
    logQCVars_("Process FAILED", {
      errorMessage: e.toString(),
      errorStack: e.stack || "No stack available",
      eventDataAtFailure: eventData 
    });
  }
}

/**
 * Creates individual hourly shift objects from a start and end time.
 * Shifts have a max capacity of 1.
 * @param {object} eventData The event data object containing:
 * - deceasedName (string)
 * - locationName (string)
 * - startDate (Date)
 * - endDate (Date)
 * @returns {Array<object>} An array of structured shift objects.
 * @private
 */
/**
 * Creates individual hourly shift objects from a start and end time.
 * Shifts have a max capacity of 1.
 * @param {object} eventData The event data object containing all form inputs and parsed Date objects.
 * @returns {Array<object>} An array of structured shift objects.
 * @private
 */
/**
 * Creates individual hourly shift objects from a start and end time.
 * Shifts have a max capacity of 1.
 * @param {object} eventData The event data object containing all form inputs and parsed Date objects.
 * @returns {Array<object>} An array of structured shift objects.
 * @private
 */
function createHourlyShifts_(eventData) {
 
     // --- DEBUG: Log entire eventData object ---
    if (DEBUG) {
      Logger.log("=== Creating Shifts ===");
      Logger.log("=== FULL eventData OBJECT ===");
      Logger.log(JSON.stringify(eventData, null, 2));
      Logger.log("=== END eventData ===");
    }
 
 
  // Validate required fields
  if (!eventData || 
      !eventData.startDate || 
      !eventData.endDate || 
      !eventData.deceasedName || 
      !eventData.locationName) {
    Logger.log('Error: Missing required event data fields');
    return [];
  }
  
  const shifts = [];
  
  // Create copies of the Date objects for iteration
  let currentStart = new Date(eventData.startDate.getTime());
  const endDate = new Date(eventData.endDate.getTime());
  
  // Edge case check
  if (currentStart >= endDate) {
    Logger.log('Warning: Start date is not before end date. No shifts created.');
    return shifts;
  }

  while (currentStart < endDate) {
    let currentEnd = new Date(currentStart.getTime());
    currentEnd.setHours(currentStart.getHours() + 1);

    // Cap at endDate if we exceed it
    if (currentEnd > endDate) {
      currentEnd = new Date(endDate.getTime()); 
    }
    
    // Format for display
    const dateStr = currentStart.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    const timeStr = `${currentStart.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    })} - ${currentEnd.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    })}`;

    // Generate a unique ID
    const shiftId = Utilities.getUuid(); 

    shifts.push({
      id: shiftId,
      deceasedName: eventData.deceasedName,
      eventLocation: eventData.locationName, 
      eventDate: dateStr,
      shiftTime: timeStr,
      maxVolunteers: 1,
      currentVolunteers: 0,      
      startTimeEpoch: currentStart.getTime(),
      endTimeEpoch: currentEnd.getTime(), 
      pronoun: eventData.pronoun,
      metOrMeita: eventData.metOrMeita,
      personalInfo: eventData.personalInfo
    });

    // Move to next hour (the while condition handles exit)
    currentStart = new Date(currentEnd.getTime());
  }

  return shifts;
}





/**
 * Synchronizes the generated shifts to the Shifts Master sheet.
 * @param {Array<object>} allNewShifts Array of shift objects.
 * @private
 */
/**
 * Synchronizes the generated shifts to the Shifts Master sheet.
 * @param {Array<object>} allNewShifts Array of shift objects.
 * @private
 */
function syncShiftsToSheet(allNewShifts) {
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHIFTS_MASTER_SHEET);
    if (!sheet) throw new Error(`Sheet not found: ${SHIFTS_MASTER_SHEET}`);

    const newRows = allNewShifts.map(shift => [
      shift.id,                 // 0 - Shift ID
      shift.deceasedName,       // 1 - Deceased Name (was shift.eventName)
      shift.eventLocation,      // 2 - Location (was at index 7)
      shift.eventDate,          // 3 - Event Date
      shift.shiftTime,          // 4 - Shift Time
      shift.maxVolunteers,      // 5 - Max Volunteers
      shift.currentVolunteers,  // 6 - Current Volunteers
      shift.startTimeEpoch,     // 7 - Start Epoch
      shift.endTimeEpoch,       // 8 - End Epoch
      shift.pronoun,            // 9 - Pronoun (NEW)
      shift.metOrMeita,         // 10 - Met or Meita (NEW)
      shift.personalInfo        // 11 - Personal Info (NEW)
    ]);

    // Check if the sheet is empty to write headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Shift ID',           // 0
        'Deceased Name',      // 1
        'Location',           // 2
        'Event Date',         // 3
        'Shift Time',         // 4
        'Max Volunteers',     // 5
        'Current Volunteers', // 6
        'Start Epoch',        // 7
        'End Epoch',          // 8
        'Pronoun',            // 9
        'Met or Meita',       // 10
        'Personal Info'       // 11
      ]);
    }
    
    // Append all new shift rows in one go
    if (newRows.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      const range = sheet.getRange(startRow, 1, newRows.length, newRows[0].length);
      range.setValues(newRows);
    }
    
  } catch (error) {
    Logger.log("Error in syncShiftsToSheet: " + error.toString());
    throw error;
  }
}


/**
 * Sends individual, personalized notification emails to all volunteers about the new shifts.
 * @param {object} eventData The event data object containing:
 *   - locationName: The location of the deceased
 *   - deceasedName: Name of the deceased
 *   - pronoun: Pronoun for the deceased
 *   - metOrMeita: Met or Meita (contextual verb)
 *   - personalInfo: Additional personal info/details
 *   - startDateTimeStr: Formatted string of the shmira start day and time
 *   - endDateTimeStr: Formatted string of the funeral end day and time
 */
function sendNewShiftNotification(eventData) {
  // Validate required fields
  if (!eventData || 
      !eventData.locationName || 
      !eventData.deceasedName || 
      !eventData.startDateTimeStr || 
      !eventData.endDateTimeStr) {
    Logger.log('Error: Missing required event data fields for email notification');
    return;
  }

  // Get all contact info, including the personalized URL for each volunteer
  const volunteerContacts = getAllVolunteerContactInfo_();
  
  if (volunteerContacts.length === 0) {
    Logger.log("No valid volunteer contacts (email and personalized URL) found to send notification.");
    return;
  }
  
  // Use the requested subject line
  const subject = `Baruch Dayan Ha-Emet - Death of ${eventData.deceasedName} - Chevra Kadisha Services Needed`;
  let successCount = 0;
  
  // Get the full address for the email body
  const fullAddress = getAddressFromLocationName_(eventData.locationName);

  volunteerContacts.forEach(volunteer => {
    // Construct the highly specific email body
    const body = `
      Dear ${volunteer.name},

      Baruch Dayan Ha'Emet. We sadly notify you of the death of ${eventData.deceasedName}.
      
      ${eventData.pronoun} ${eventData.metOrMeita} is at ${eventData.locationName} (Address: ${fullAddress}).
      
      Shmira will start on ${eventData.startDateTimeStr} and is scheduled to end for the funeral on ${eventData.endDateTimeStr}.

      ${eventData.personalInfo}. More information will be sent as it arrives.

      As a reminder, only Boulder Chevra Kadisha Member Volunteers can sit shmira after business hours at the mortuaries. Members can log in to the Member Volunteer portal on www.BoulderChevraKadisha.org for after hours facility access information.
      
      Thank you for your mitzvah of providing shmira for this member of our community.

      To view the schedule and sign up for shifts, please click the link below. This link is unique to you. Please do not share it.

      Your Volunteer Portal Link: ${volunteer.url}
    `;

    try {
      MailApp.sendEmail({
        to: volunteer.email,
        subject: subject,
        body: body
      });
      Logger.log(`Notification sent successfully to ${volunteer.email} for event: ${eventData.deceasedName}.`);
      successCount++;
    } catch (error) {
      Logger.log(`ERROR sending notification email to ${volunteer.email}: ${error.toString()}`);
    }
  });
  
  Logger.log(`Finished sending new shift notifications. Total emails attempted: ${volunteerContacts.length}. Successful: ${successCount}.`);
}


/**
 * Retrieves a list of all volunteer contact information (name, email, and personalized URL).
 * This is used for mass notification emails.
 * @returns {Array<object>} An array of objects with {name, email, token, url}.
 * @private
 */
function getAllVolunteerContactInfo_() {
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(VOLUNTEER_LIST_SHEET);
    if (!sheet) throw new Error(`Sheet not found: ${VOLUNTEER_LIST_SHEET}`);

    const data = sheet.getDataRange().getValues();
    const contacts = [];
    // Start at row 1 to skip headers
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const name = String(row[VOL_NAME_COL] || 'Volunteer');
      const email = String(row[VOL_EMAIL_COL]);
      const token = String(row[VOL_TOKEN_COL] || '');
      const url = String(row[VOL_URL_COL] || '');

      // Only include contacts with a valid email and a personalized URL/Token
      if (email.includes('@') && (url.includes('?t=') || url.includes('?token=')) && token !== '') {
        contacts.push({
          name: name,
          email: email,
          token: token,
          url: url 
        });
      }
    }
    return contacts;
  } catch (e) {
    Logger.log("Error in getAllVolunteerContactInfo_: " + e.toString());
    return [];
  }
}



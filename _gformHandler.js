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


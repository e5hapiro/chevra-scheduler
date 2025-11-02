/**
* -----------------------------------------------------------------
* _sync_shifts.js
* Chevra Kadisha Shifts Scheduler
* Shift Synchronization
* -----------------------------------------------------------------
* _sync_shifts.js
 * Version: 1.0.1
 * Last updated: 2025-11-02
 * 
 * CHANGELOG v1.0.1:
 *   - Initial implementation of createHourlyShifts_.
 *   - Added logging and error handling.
 *   - Added shift synchronization to the Shifts Master sheet.
 * Shift Synchronization
 * -----------------------------------------------------------------
 */

/**
 * Updates the shifts master sheet with the latest data from the events sheet.  Creates new shifts and updates the shifts master sheet.
 * @returns {void}
 * @returns {Array<object>} An array of structured shift objects.
 */
function updateShifts(sheetInputs, DEBUG) {

  var shifts = []; 
  var events = [];

  try {

    // The master workbook
    const ss = getSpreadsheet_(sheetInputs.SPREADSHEET_ID);

    // The events sheet
    const eventSheet = ss.getSheetByName(sheetInputs.EVENT_FORM_RESPONSES);
    if (!eventSheet) throw new Error(`Sheet not found: ${sheetInputs.EVENT_FORM_RESPONSES}`);

    var events = getEvents(eventSheet);

    // The shifts master sheet
    const shiftsMasterSheet = ss.getSheetByName(sheetInputs.SHIFTS_MASTER_SHEET);
    if (!shiftsMasterSheet) throw new Error(`Sheet not found: ${sheetInputs.SHIFTS_MASTER_SHEET}`);
    var shifts = getExistingShiftsMasterRows(shiftsMasterSheet);

    syncShiftsToMaster_(events, shifts);


  } catch (error) {
    Logger.log("Error in updateShifts_: " + error.toString());
    throw error;
  }

  return shifts;

}


/**
 * Retrieves the existing shifts master rows from the shifts master sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The shifts master sheet.
 * @returns {Array<object>} - The existing shifts master rows.
 */
function getExistingShiftsMasterRows(sheet) {
  var data = sheet.getDataRange().getValues();
  return data.slice(1); // skip headers
}


/**
 * Compares events with the existing master shifts table
 * and updates the shifts master with any missing shifts.
 * Should run periodically (e.g., every 10 minutes).
 * @param {Array<object>} events Array of event objects, each with parsed Date fields.
 * @param {Array<object>} shifts Array of shift master objects, as currently on the sheet.
 * @returns {void}
 */
function syncShiftsToMaster_(events, shifts) {
  var allNewShifts = [];

  // ---- 1. Build Sets for Fast Comparison ----
  // Set of current valid shift keys (from events)
  var validShiftKeys = new Set();
  // Set of existing in-sheet shift keys (for deduplication)
  var existingShiftKeys = new Set();

  // Helper: Standard key for uniqueness by deceased, location, start/end epoch
  function getShiftKey(shift) {
    return [
      shift.deceasedName,
      shift.eventLocation,
      shift.startTimeEpoch,
      shift.endTimeEpoch
    ].join('|');
  }

  // Existing shift keys
  shifts.forEach(shift => existingShiftKeys.add(getShiftKey(shift)));

  // All valid shifts according to current events
  var allCurrentEventShifts = [];
  events.forEach(event => {
    var eventShifts = createHourlyShifts_(event); // <-- Should NOT write to sheet itself
    eventShifts.forEach(shift => {
      validShiftKeys.add(getShiftKey(shift));
      allCurrentEventShifts.push(shift);
      // New shifts: any valid event shift not in sheet yet
      if (!existingShiftKeys.has(getShiftKey(shift))) {
        allNewShifts.push(shift);
      }
    });
  });

  // ---- 2. Remove Obsolete Shifts ----
  // Find rows in the master not present in the validShiftKeys
  var rowsToDelete = [];
  shifts.forEach((shift, idx) => {
    var key = getShiftKey(shift);
    if (!validShiftKeys.has(key)) {
      rowsToDelete.push(idx + 2); // +2, as Sheets are 1-based and skip header row
    }
  });

  // Remove obsolete rows, starting from the bottom to avoid row index shifts
  if (rowsToDelete.length > 0) {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHIFTS_MASTER_SHEET);
    // Sort descending to not disrupt row numbers when deleting
    rowsToDelete.sort(function(a, b) { return b - a; }); 
    rowsToDelete.forEach(function(rowNum) {
      sheet.deleteRow(rowNum);
    });
  }

  // ---- 3. Add Any New Shifts ----
  if (allNewShifts.length > 0) {
    syncShiftsToSheet(allNewShifts);
  }
}




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

  // Create hourly shifts
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




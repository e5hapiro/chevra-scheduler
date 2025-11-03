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

  Logger.log("Processing form submit");
  // Force updates
  bckLib.addToken(e, TOKEN_COLUMN_NUMBER)
  bckLib.updateShiftsAndEventMap();

}


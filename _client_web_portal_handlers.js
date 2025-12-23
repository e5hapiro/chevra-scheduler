
/**
* -----------------------------------------------------------------
* _client_web_portal_handlers.js
* Chevra Kadisha Shifts Scheduler
* Web Portal and Google Form Initialization
* -----------------------------------------------------------------
* _webPortalInit.js
 * Version: 1.0.7
 * Last updated: 2025-12-22
 * 
 * CHANGELOG 
 *   v1.0.1:
 *   - Initial implementation of doGet.
 *   - Added logging and error handling.
 *   - Added volunteer information retrieval.
 *   - Added HTML template creation.
 *   - Added error handling and logging.
 *   - Added logging and error handling.
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
 *   v1.0.6:
 *   - Consolidated logic and moved standard logic to getShifts in bckLib
 *   v1.0.7:
 *   - Fixed bug in processFormSubmit, failed to include config properties in bckLib.updateShiftsAndEventMap(setConfigProperties())
 * 
 * Web Portal Initialization and Submit Handler
 * -----------------------------------------------------------------
 */
/**
 * MAIN ENTRY POINT for the Web App.
 * Handles the URL request and renders the HTML.
 */


function doGet(e) {
  Logger.log("--- START doGet invocation ---");

  // Helper function to centralize error output (avoids repetition)
  function errorHtmlOutput_() {
    return HtmlService.createHtmlOutput('<h1>Fatal App Error</h1><p>The system failed to load the interface. Please contact support. (Check Logs for FATAL ERROR in doGet)</p>');
  }

  const memberToken = e.parameter.m || null;
  const guestToken = e.parameter.g || null;

  // Determine the volunteerToken 
  const volunteerToken = memberToken || guestToken;
  
  // Exit early if no token is present, reducing nesting
  if (!volunteerToken) {
    Logger.log("No member or guest token found in URL parameters.");
    return errorHtmlOutput_();
  }

  // Determine token type; only needed if the called function requires it
  const isMember = !!memberToken; 

  try {
    const sheetInputs = setConfigProperties();
    const nameOnly = true;

    // Use isMember directly in the call. volunteerToken is guaranteed to be set here.
    var volunteerData = bckLib.getShifts(sheetInputs, volunteerToken, isMember, SHIFT_FLAGS.NONE, nameOnly);

    // Proceed with opening form if the volunteer data is available.
    if (volunteerData) {
      const template = HtmlService.createTemplateFromFile('index');
      

      // Template data setting remains the same
      //template.data = JSON.stringify(volunteerData);
      //template.data = JSON.stringify(cleanForReturn(volunteerData));
      //template.data = JSON.stringify({ msg: "Hello from doGet!", value: 42 });

      template.data = JSON.stringify(volunteerData);
      logQCVars_('doGet[template.data1]', template.data);

/*
      volunteerData = {
        name: "Micha Shapiro",
        token: "4a477c94-ac0c-400b-a0d6-98fc90014fb2",
        email: "eshapiro@gmail.com",
        isMember: true
        // Add more attributes as needed
      };

      logQCVars_('doGet[VolunteerData2]', volunteerData);

      template.data = JSON.stringify(volunteerData);
      logQCVars_('doGet[template.data2]', template.data);
*/
      return template.evaluate()
        .setTitle('Volunteer Portal')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } 
    else {
      Logger.log("Token found but failed validation.");
      return errorHtmlOutput_();
    }
  } catch (error) {
    Logger.log("FATAL ERROR in doGet: " + error.toString());
    return errorHtmlOutput_();
  }
}

/**
 * Includes another HTML file (used for JS/CSS/partials).
 * @param {string} filename
 * @returns {string}
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Handles the 'On form submit' trigger from the administrator's event form.
 * This function processes the form response and updates the Shifts Master sheet.
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e The form submit event object.
 */
function processFormSubmit(e) {

  Logger.log("Processing form submit");
  // Force updates
  bckLib.addToken(e, TOKEN_COLUMN_NUMBER)
  bckLib.updateShiftsAndEventMap(setConfigProperties());

}

/**
 * Handles the 'On open' trigger to enable the administrators menu choice.
 * This function creates and opens a menu and provides access specific form handlers.
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e The form submit event object.
 */

function onOpen() {


  // Add a custom menu to the spreadsheet.
  var ui = SpreadsheetApp.getUi();
      ui.createMenu('BCK Admin')
      .addItem('About BCK', 'menuAbout')
      .addSeparator()
      .addSubMenu(ui.createMenu('Trigger')
        .addItem('Trigger Emails', 'menuTriggerEmails'))
      .addToUi();
}


// Handler for the Trigger Emails item
function menuTriggerEmails() {
  triggeredFunction();
  SpreadsheetApp.getUi().alert('Trigger Emails function has been executed');
}

// Handler for the About menu item
function menuAbout() {
  bckLib.displayAbout();
}



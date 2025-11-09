
/**
* -----------------------------------------------------------------
* _webPortalInit.js
* Chevra Kadisha Shifts Scheduler
* Web Portal Initialization
* -----------------------------------------------------------------
* _webPortalInit.js
 * Version: 1.0.1
 * Last updated: 2025-10-30
 * 
 * CHANGELOG v1.0.1:
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
 * 
 * Web Portal Initialization and Submit Handler
 * -----------------------------------------------------------------
 */
/**
 * MAIN ENTRY POINT for the Web App.
 * Handles the URL request and renders the HTML.
 */

function doGet(e) {
  try {
    Logger.log("--- START doGet invocation ---");

    // Fetch tokens for member (m) and guest (g)
    const memberToken = e.parameter.m || null;
    const guestToken = e.parameter.g || null;

    var info = null;
    var volunteerData = null;
    const nameOnly = true;     // To reduce load time, only the name is needed on init.

    if (memberToken) {

      info = bckLib.getMemberInfoByToken(setConfigProperties(), memberToken, nameOnly);

      var fullName = info.firstName + " " + info.lastName;

      if(fullName.trim === "") {
        fullName = "Volunteer";      
      }


      logQCVars_('memberToken info', info);
      if (info) {

        volunteerData = {
          name: fullName,
          token: memberToken,
          isMember: true,
          events: info.events
          // Add more attributes as needed
        };

        Logger.log(`Member authenticated: ${volunteerData.name} (Token: ${volunteerData.token.substring(0, 5)}...)`);
      } else {
        Logger.log("Member token found but failed validation.");
      }
    } else if (guestToken) {
      
      info = bcklib.getGuestInfoByToken(setConfigProperties(), guestToken, nameOnly);

      var fullName = info.firstName + " " + info.lastName;

      if(fullName.trim === "") {
        fullName = "Volunteer";      
      }

      logQCVars_('guestToken info', info);
      if (info) {

        volunteerData = {
          name: fullName,
          token: memberToken,
          isMember: false,
          events: info.events
          // Add more attributes as needed
        };

        Logger.log(`Guest authenticated: ${volunteerData.name} (Token: ${volunteerData.token.substring(0, 5)}...)`);

      } else {
        Logger.log("Guest token found but failed validation.");
      }
    } else {
      Logger.log("No member or guest token found in URL parameters.");
    }

    const template = HtmlService.createTemplateFromFile('index');

    logQCVars_('volunteer data', volunteerData);


    template.data = JSON.stringify(volunteerData);  // Pass as JSON string
    //logQCVars_("template",template);

    return template.evaluate()
      .setTitle('Volunteer Portal')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);


  } catch (error) {
    Logger.log("FATAL ERROR in doGet: " + error.toString());
    return HtmlService.createHtmlOutput('<h1>Fatal App Error</h1><p>The system failed to load the interface. Please contact support. (Check Logs for FATAL ERROR in doGet)</p>');
  }
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
  bckLib.updateShiftsAndEventMap();

}




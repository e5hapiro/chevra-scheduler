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
 * Web Portal Initialization
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

    if (memberToken) {
      const info = getMemberInfoByToken(setConfigProperties(), memberToken);
      logQCVars_('memberToken info', info);
      if (info) {

        volunteerData = {
          name: info.firstName + " " + info.lastName,
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
      const info = getGuestInfoByToken(setConfigProperties(), guestToken);
      logQCVars_('guestToken info', info);
      if (info) {

        volunteerData = {
          name: info.firstName + " " + info.lastName,
          token: guestToken,
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



/**
 * MAIN ENTRY POINT for the Web App.
 * Handles the URL request and renders the HTML.
 */
function doGet(e) {
  try {
    Logger.log("--- START doGet invocation ---"); 
    
    // *** FIX: Now checks for both 't' and 'token' parameters ***
    const volunteerToken = e.parameter.t || e.parameter.token || null; 
    let volunteerName = "Volunteer";

    if (volunteerToken) {
      const info = getVolunteerInfoByToken_(volunteerToken);
      if (info) {
         volunteerName = info.name;
         Logger.log(`User authenticated: ${volunteerName} (Token: ${volunteerToken.substring(0, 5)}...)`);
      } else {
         Logger.log("Token found but failed validation.");
      }
    } else {
      Logger.log("No token found in URL parameters.");
    }
    
    const template = HtmlService.createTemplateFromFile('volunteer_portal');
    template.volunteerName = volunteerName;
    template.volunteerToken = volunteerToken;

    return template.evaluate()
        .setTitle('Volunteer Portal')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    Logger.log("FATAL ERROR in doGet: " + error.toString());
    return HtmlService.createHtmlOutput('<h1>Fatal App Error</h1><p>The system failed to load the interface. Please contact support. (Check Logs for FATAL ERROR in doGet)</p>');
  }
}


// Dummy function needed for HtmlService.createTemplateFromFile
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


/**
 * UTILITY FUNCTIONS
 * -------------------------------------------------------------------
 */


/**
 * Retrieves volunteer information based on the token.
 * @param {string} token The unique volunteer token.
 * @returns {object|null} Object containing name, email, token, URL, and index.
 * @private
 */
function getVolunteerInfoByToken_(token) {
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(VOLUNTEER_LIST_SHEET);
    if (!sheet) throw new Error(`Sheet not found: ${VOLUNTEER_LIST_SHEET}`);

    const data = sheet.getDataRange().getValues();
    // Start at row 1 to skip headers
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Check the token against the VOL_TOKEN_COL
      if (row[VOL_TOKEN_COL] === token) { 
        return {
          name: row[VOL_NAME_COL],
          email: row[VOL_EMAIL_COL],
          token: token,
          url: row[VOL_URL_COL], 
          rowIndex: i + 1 
        };
      }
    }
    return null;
  } catch (e) {
    Logger.log("Error in getVolunteerInfoByToken_: " + e.toString());
    throw e;
  }
}

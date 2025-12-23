/**
* -----------------------------------------------------------------
* _globals.js
* Chevra Kadisha Shifts Scheduler
* Global constants and variables
* -----------------------------------------------------------------
* globals.js
 * Version: 1.0.8
 * Last updated: 2025-12-01
 * 
 * CHANGELOG v1.0.7:
 *   - Eliminated unused constants from earlier implementations
 * v1.0.8
 *   - Removed unused Globals variables
 * -----------------------------------------------------------------
 */

/**
 * Configuration and Constants
 * * IMPORTANT: You must replace WEB_APP_URL and SPREADSHEET_ID with your actual sID.
 * Timing is critical. First create a new deployment with deploy button above, and then copy the URL into the WEB_APP_URL constant below 
 */

// --- CONFIGURATION ---
const DEBUG = true;
const TOKEN_COLUMN_NUMBER = 12;
const SPREADSHEET_ID = '1cCouQRRpEN0nUhN45m14_z3oaONo7HHgwyfYDkcu2mw'; 


// Sheet Names
const VOLUNTEER_LIST_SHEET = 'Volunteers';
const EVENT_FORM_RESPONSES = 'Form Responses 1';
const SHIFTS_MASTER_SHEET = 'Shifts Master';
const SIGNUPS_SHEET = 'Volunteer Signups';
const GUESTS_SHEET = 'Guests';
const MEMBERS_SHEET = 'Members';
const LOCATIONS_SHEET = 'Locations';
const EVENT_MAP = 'Event Map';
const ARCHIVE_EVENT_MAP = 'Archive Event Map';

// Used to get specific types of shifts in event information
const SHIFT_FLAGS = {
  NONE: 0,
  AVAILABLE: 1,
  SELECTED: 2,
  EVENT: 4,
};


/**
 * Sets script properties
 * @returns {void}
 */
function setConfigProperties() {

   const webAppUrl = bckLib.getWebAppUrl();

   console.log("webAppUrl: " + webAppUrl);
   const ss = getActiveSpreadsheetId();

  // hardcode the names of the sheet databases
  const sheetInputs = {
    DEBUG: DEBUG,
    SCRIPT_URL: webAppUrl,
    SPREADSHEET_ID: ss,
    EVENT_FORM_RESPONSES: 'Form Responses 1',
    SHIFTS_MASTER_SHEET: 'Shifts Master',
    VOLUNTEER_LIST_SHEET: 'Volunteer Shifts',
    GUESTS_SHEET: 'Guests',
    MEMBERS_SHEET: 'Members',
    LOCATIONS_SHEET: 'Locations',
    EVENT_MAP: 'Event Map',
    ARCHIVE_EVENT_MAP: 'Archive Event Map',
    TOKEN_COLUMN_NUMBER: 12
  };

  return sheetInputs;

}


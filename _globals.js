/**
* -----------------------------------------------------------------
* _globals.js
* Chevra Kadisha Shifts Scheduler
* Global constants and variables
* -----------------------------------------------------------------
* globals.js
 * Version: 1.0.7
 * Last updated: 2025-11-30
 * 
 * CHANGELOG v1.0.7:
 *   - Eliminated unused constants from earlier implementations
 * -----------------------------------------------------------------
 */

/**
 * Configuration and Constants
 * * IMPORTANT: You must replace SPREADSHEET_ID with your actual sheet ID.
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


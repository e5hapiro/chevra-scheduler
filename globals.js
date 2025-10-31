// --- QA & DEBUGGING CONSTANT ---
// Set to true to see detailed QC logs.
// Set to false for production to reduce logging.
const DEBUG = true;

/**
 * Configuration and Constants
 * * IMPORTANT: You must replace SPREADSHEET_ID with your actual sheet ID.
 */

// --- CONFIGURATION ---

// Hardcoded confidential addresses for the two potential preparation sites.
const ADDRESS_CONFIG = {
  'Crist Mortuary': '3395 Penrose Pl, Boulder, CO 80301',
  'Greenwood & Myers Mortuary': '2969 Baseline Road, Boulder, CO 80303'
}
const SPREADSHEET_ID = '1cCouQRRpEN0nUhN45m14_z3oaONo7HHgwyfYDkcu2mw'; 

// Sheet Names
const VOLUNTEER_LIST_SHEET = 'Volunteers';
const EVENT_FORM_RESPONSES = 'Form Responses 1';
const SHIFTS_MASTER_SHEET = 'Shifts Master';
const SIGNUPS_SHEET = 'Volunteer Signups';
const GUESTS_SHEET = 'Guests';
const MEMBERS_SHEET = 'Members';
const EVENT_MAP = 'Event Map';
const ARCHIVE_EVENT_MAP = 'Archive Event Map';

// Column Indices (0-based) for SHIFTS_MASTER_SHEET
const SHIFT_ID_COL = 0;
const SHIFT_CUR_VOL_COL = 5;
const SHIFT_MAX_VOL_COL = 4;
const SHIFT_START_EPOCH_COL = 6;
const SHIFT_EVENT_NAME_COL = 1; 
const SHIFT_EVENT_DATE_COL = 2;
const SHIFT_SHIFT_TIME_COL = 3;
const SHIFT_SHIFT_LOCATION_COL = 7; 
const SHIFT_SHIFT_DECEASEDNAME_COL = 8; // Deceased Name
const SHIFT_END_EPOCH_COL = 9;      

// Column Indices (0-based) for SIGNUPS_SHEET
const SIGNUP_SHIFT_ID_COL = 1;
const SIGNUP_TOKEN_COL = 2;
const SIGNUP_NAME_COL = 3;

// Column Indices (0-based) for VOLUNTEER_LIST_SHEET
const VOL_NAME_COL = 0;
const VOL_EMAIL_COL = 1;
const VOL_TOKEN_COL = 2;
const VOL_URL_COL = 3; // The column that stores the personalized URL

// Column Indices (0-based) for MEMBERS_SHEET
const MEMBERS_TIMESTAMP_COL = 0;            // D1 Timestamp
const MEMBERS_EMAIL_ADDRESS_COL = 1;        // E1 Email Address
const MEMBERS_FIRST_NAME_COL = 2;           // F1 First Name
const MEMBERS_LAST_NAME_COL = 3;            // G1 Last Name
const MEMBERS_ADDRESS_COL = 4;              // H1 Address
const MEMBERS_CITY_COL = 5;                 // I1 City
const MEMBERS_STATE_COL = 6;                // J1 State
const MEMBERS_ZIP_COL = 7;                  // K1 Zip
const MEMBERS_PHONE_COL = 8;                // L1 Phone
const MEMBERS_CAN_TEXT_COL = 9;             // M1 Can we text you at the above phone number?
const MEMBERS_SHMIRA_COL = 9;             // N1 Are you interested in volunteering to sit shmira?
const MEMBERS_TOKEN_COL = 20;               // O1 Token
const MEMBERS_APPROVALS_COL = 21;           // P1 Approvals

// Column Indices (0-based) for GUESTS_SHEET
const TIMESTAMP_COL = 0;            // D1 Timestamp
const EMAIL_ADDRESS_COL = 1;        // E1 Email Address
const FIRST_NAME_COL = 2;           // F1 First Name
const LAST_NAME_COL = 3;            // G1 Last Name
const ADDRESS_COL = 4;              // H1 Address
const CITY_COL = 5;                 // I1 City
const STATE_COL = 6;                // J1 State
const ZIP_COL = 7;                  // K1 Zip
const PHONE_COL = 8;                // L1 Phone
const CAN_TEXT_COL = 9;             // M1 Can we text you at the above phone number?
const NAME_OF_DECEASED_COL = 10;    // N1 Name of Deceased
const RELATIONSHIP_COL = 11;        // O1 Relationship to Deceased
const OVER_18_COL = 12;             // P1 Are you over 18 years old?
const UNDER_18_INFO_COL = 13;       // Q1 Info: Under 18 shmira policy
const BUSINESS_HOURS_COL = 14;      // R1 Able to sit shmira during business hours?
const AFTER_HOURS_COL = 15;         // S1 Want to discuss sitting shmira after hours?
const AFFILIATION_COL = 16;         // T1 What is your affiliation?
const SYNAGOGUE_INFO_COL = 17;      // U1 Name, City and State of synagogue
const MAILING_LIST_COL = 18;        // V1 Want to be on mailing list?
const AGREEMENT_COL = 19;           // W1 Certification & agreement
const TOKEN_COL = 20;               // X1 Token
const APPROVALS_COL = 21;           // Y1 Approvals



const TOKEN_COLUMN_NUMBER = 12;


// Column Indices (0-based) for EVENT_FORM_RESPONSES (used for current event info)
// Col D (Location) is index 3.
// Col C (Deceased Name) is index 8.
// Col L (Personal Info) is index 11.

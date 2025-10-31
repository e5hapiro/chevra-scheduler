/**
* -----------------------------------------------------------------
* _trigger_emails.js
* Chevra Kadisha Shifts Scheduler
* Trigger Emails
* -----------------------------------------------------------------
* _trigger_emails.js
 * Version: 1.0.1
 * Last updated: 2025-10-30
 * 
 * CHANGELOG v1.0.1:
 *   - Initial implementation of updateEventMap.
 *   - Added logging and error handling.
 *   - Added event, guest, and member data retrieval.
 *   - Added mapping synchronization.
 *   - Added email sending.
 *   - Added error handling and logging.
 *   - Added logging and error handling.
 *
 * Trigger Emails
 * -----------------------------------------------------------------
 */


/**
 * Updates the event map with the latest data from the events, guests, and members sheets.
 * Sends emails to guests and members who have not yet received an email.
 * @private
 */
/**
 * Updates the event map with the latest data from the events, guests, and members sheets.
 * Sends emails to guests and members who have not yet received an email.
 * @private
 */
function updateEventMap() {

  // The master workbook
  const ss = getSpreadsheet_();

  // The events sheet
  const eventSheet = ss.getSheetByName(EVENT_FORM_RESPONSES);
  if (!eventSheet) throw new Error(`Sheet not found: ${EVENT_FORM_RESPONSES}`);

  // The guests sheet
  const guestSheet = ss.getSheetByName(GUESTS_SHEET);
  if (!guestSheet) throw new Error(`Sheet not found: ${GUESTS_SHEET}`);

  // The members sheet
  const memberSheet = ss.getSheetByName(MEMBERS_SHEET);
  if (!memberSheet) throw new Error(`Sheet not found: ${MEMBERS_SHEET}`);

  // The map sheet
  const mapSheet = ss.getSheetByName(EVENT_MAP);
  if (!mapSheet) throw new Error(`Sheet not found: ${EVENT_MAP}`);

  // The archive map sheet
  const archiveSheet = ss.getSheetByName(ARCHIVE_EVENT_MAP);
  if (!mapSheet) throw new Error(`Sheet not found: ${ARCHIVE_EVENT_MAP}`);


  var events = getEvents(eventSheet);
  var guests = getApprovedGuests(guestSheet);
  var members = getApprovedMembers(memberSheet);
  var existingMapRows = getExistingMapRows(mapSheet);
  
  syncMappings(events, guests, members, existingMapRows, mapSheet, archiveSheet);

  // After removals need to refresh the existing Map Rows before printing
  existingMapRows = getExistingMapRows(mapSheet);

  // Now send a mail for any guests and events that have not already been sent the mail
  mailMappings(events, guests, members, existingMapRows);

}

/**
 * Retrieves the events data from the events sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The events sheet.
 * @returns {Array<object>} - The events data.
 */
function getEvents(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  // Get indices for all columns
  var timestampCol = headers.indexOf("Timestamp");
  var emailCol = headers.indexOf("Email Address");
  var deceasedNameCol = headers.indexOf("Deceased Name");
  var locationCol = headers.indexOf("Location");
  var startDateCol = headers.indexOf("Start Date");
  var startTimeCol = headers.indexOf("Start Time");
  var endDateCol = headers.indexOf("End Date");
  var endTimeCol = headers.indexOf("End Time");
  var personalInfoCol = headers.indexOf("Personal Information");
  var pronounCol = headers.indexOf("Pronoun");
  var metOrMeitaCol = headers.indexOf("Met-or-Meita");
  var tokenCol = headers.indexOf("Token");

  return data.slice(1).map(function(row) {
    return {
      timestamp: row[timestampCol],
      email: row[emailCol],
      deceasedName: row[deceasedNameCol],
      locationName: row[locationCol],
      startDate: row[startDateCol],
      startTime: row[startTimeCol],
      endDate: row[endDateCol],
      endTime: row[endTimeCol],
      personalInfo: row[personalInfoCol],
      pronoun: row[pronounCol],
      metOrMeita: row[metOrMeitaCol],
      token: row[tokenCol],
      // Optionally add a unique id field for mapping
      id: row[tokenCol] // or another unique identifier column
    };
  });
}

/**
 * Retrieves the approved guests data from the guests sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The guests sheet.
 * @returns {Array<object>} - The approved guests data.
 */
function getApprovedGuests(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  // Find all column indices
  var idx = {};
  headers.forEach(function(h, i) { idx[h] = i; });

  return data.slice(1)
    .filter(function(row) {
      var approval = (row[idx['Approvals']] || "").toString().trim().toLowerCase();
      return approval === "yes" || approval === "true";
    })
    .map(function(row) {
      return {
        timestamp: row[idx['Timestamp']],
        email: row[idx['Email Address']],
        firstName: row[idx['First Name']],
        lastName: row[idx['Last Name']],
        address: row[idx['Address']],
        city: row[idx['City']],
        state: row[idx['State']],
        zip: row[idx['Zip']],
        phone: row[idx['Phone']],
        canText: row[idx['Can we text you at the above phone number?']],
        names: (row[idx['Name of Deceased']] || "")
          .toString()
          .split(',')
          .map(function(n) { return n.trim().toLowerCase(); }),
        relationship: row[idx['Relationship to Deceased']],
        over18: row[idx['Are you over 18 years old?']],
        sitAlone: row[idx["To sit shmira alone with the Boulder Chevra Kadisha, you must be over 18 years old. If you are under 18 years old, you can sit shmira with a Boulder Chevra Kadisha Member or a parent/guardian. If you will sit shmira with a parent or guardian, have them fill out the form. If you would like to be matched up with a Member of the Boulder Chevra Kadisha, you can continue to complete the form."]],
        canSitDuringBusiness: row[idx["Are you able to sit shmira during the mortuary's normal business hours? (Business hours are Monday through Friday 9am - 5pm)"]],
        sitAfterHours: row[idx["To sit shmira alone after business hours of the mortuary, you must be a Boulder Chevra Kadisha Member. If you are not a member and still want to sit shmira and you are only able to sit shmira outside of regular business hours, we can match you with a member. Would you like to discuss sitting shmira with a Boulder Chevra Kadisha Member?"]],
        affiliation: row[idx["What is your affiliation? (The Boulder Chevra Kadisha is a community wide chevra kadisha. We serve all Jews in Boulder County - affiliated of not.)"]],
        synagogue: row[idx['Name, City and State of synagogue.']],
        onMailingList: row[idx['Do you want to be on our mailing list for events and training?']],
        agreement: row[idx['By submitting this application, I certify the information is true and accurate and I agree with the terms and conditions of sitting shmira with the Boulder Chevra Kadisha.']],
        token: row[idx['Token']],
        approvals: row[idx['Approvals']]
      };
    });
}

/**
 * Retrieves the approved members data from the members sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The members sheet.
 * @returns {Array<object>} - The approved members data.
 */
function getApprovedMembers(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  // Map headers to column indices
  var idx = {};
  headers.forEach(function(h, i) { idx[h] = i; });

  return data.slice(1)
    .filter(function(row) {
      var approval = (row[idx['Approvals']] || "").toString().trim().toLowerCase();
      return approval === "yes" || approval === "true";
    })
    .map(function(row) {
      return {
        timestamp: row[idx['Timestamp']],
        email: row[idx['Email Address']],
        firstName: row[idx['First Name']],
        lastName: row[idx['Last Name']],
        address: row[idx['Address']],
        city: row[idx['City']],
        state: row[idx['State']],
        zip: row[idx['Zip']],
        phone: row[idx['Phone']],
        canText: row[idx['Can we text you at the above phone number?']],
        shmiraVolunteer: row[idx['Are you interested in volunteering to sit shmira?']],
        taharaVolunteer: row[idx['Are you interested in volunteering to do tahara?']],
        tachrichimVolunteer: row[idx['Are you interested in helping to make tachrichim (no sewing experience needed).']],
        hasSatShmiraBoulder: row[idx['Have you sat shmira with the Boulder Chevra Kadisha before?']],
        shmiraTraining: row[idx['Do you need/want training training for sitting shmira']],
        hasSatShmiraOther: row[idx['Have you sat shmira with another chevra kadisha before.']],
        hasDoneTaharaBoulder: row[idx['Have you participated in a tahara with the Boulder Chevra Kadisha?']],
        taharaTraining: row[idx['Do you need/want training training on tahara?']],
        taharaPreference: row[idx['Preferred way to receive requests for tahara (check all that apply)']],
        sewingMachine: row[idx['Do you have a sewing machine?']],
        affiliation: row[idx['What is your affiliation - The Boulder Chevra Kadisha is a community-wide chevra kadisha. We serve all Jews in Boulder County - affiliated of not. ']],
        synagogue: row[idx['What is the name of your synagogue (if not a local synagogue also include city, state)']],
        agreement: row[idx['By submitting this application, I certify the information is true and accurate and I agree with the terms and conditions of volunteering with the Boulder Chevra Kadisha. ']],
        communicationPreference: row[idx['Preferred way to receive communication (including shmira and tahara notifications) (check all that apply)']],
        hasSatShmiraOtherAgain: row[idx['Have you sat shmira with another chevra kadisha before?']],
        hasDoneTaharaOther: row[idx['Have you participated in a tahara with another chevra kadisha?']],
        notes: row[idx['Is there anything you want us to know about you, your skills or past chevra kadisha experience?']],
        token: row[idx['Token']],
        approvals: row[idx['Approvals']]
      };
    });
}


/**
 * Retrieves the existing map rows from the map sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The map sheet.
 * @returns {Array<object>} - The existing map rows.
 */
function getExistingMapRows(sheet) {
  var data = sheet.getDataRange().getValues();
  return data.slice(1); // skip headers
}

/**
 * Synchronizes the mappings between events, guests, and members.
 * @param {Array<object>} events - The events data.
 * @param {Array<object>} guests - The guests data.
 * @param {Array<object>} members - The members data.
 * @param {Array<object>} existingRows - The existing map rows.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} mapSheet - The map sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} archiveSheet - The archive map sheet.
 */
function syncMappings(events, guests, members, existingRows, mapSheet, archiveSheet) {
  // Build lookup for existing [source|eventToken|guest/memberToken] => emailSent
  var mapObj = {};
  existingRows.forEach(function(row) {
    var key = row[0] + '|' + row[1] + '|' + row[2];
    mapObj[key] = row[3];
  });

  // Combine guests and members, tagging source
  var allPeople = guests.map(function(p) {
    return Object.assign({}, p, {source: 'Guest'});
  }).concat(
    members.map(function(p) {
      return Object.assign({}, p, {source: 'Member'});
    })
  );

  // Build required new map keys
var requiredKeys = new Set();
var requiredRows = [];

// Guests: Only include mapping if names match
events.forEach(function(event) {
  guests.forEach(function(guest) {
    var matchNames = Array.isArray(guest.names) ? guest.names : [];
    if (matchNames.includes(event.deceasedName.toString().trim().toLowerCase())) {
      var key = "Guest|" + event.token + "|" + guest.token;
      requiredKeys.add(key);
      var emailSent = mapObj[key] !== undefined ? mapObj[key] : "";
      requiredRows.push(["Guest", event.token, guest.token, emailSent]);
    }
  });
  // Members: Map every member to every event
  members.forEach(function(member) {
    var key = "Member|" + event.token + "|" + member.token;
    requiredKeys.add(key);
    var emailSent = mapObj[key] !== undefined ? mapObj[key] : "";
    requiredRows.push(["Member", event.token, member.token, emailSent]);
  });
});


  // Identify obsolete keys to remove
  var toRemoveIndices = [];
  var toRemoveRows = [];
  existingRows.forEach(function(row, idx) {
    var key = row[0] + '|' + row[1] + '|' + row[2];
    if (!requiredKeys.has(key)) {
      toRemoveIndices.push(idx + 2); // +2 for header
      toRemoveRows.push(row);
    }
  });

  // Archive obsolete rows
  if (toRemoveRows.length > 0) {
    archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, toRemoveRows.length, toRemoveRows[0].length).setValues(toRemoveRows);
  }

  // Remove obsolete map rows in reverse order
  toRemoveIndices.reverse().forEach(function(r) {
    mapSheet.deleteRow(r);
  });

  // Add missing rows
  var alreadyPresent = new Set(existingRows.map(function(row) { return row[0] + '|' + row[1] + '|' + row[2]; }));
  var toAdd = requiredRows.filter(function(row) {
    var key = row[0] + '|' + row[1] + '|' + row[2];
    return !alreadyPresent.has(key);
  });
  if (toAdd.length) {
    mapSheet.getRange(mapSheet.getLastRow() + 1, 1, toAdd.length, 4).setValues(toAdd);
  }
}


/**
 * Sends emails to guests and members who have not yet received an email.
 * @param {Array<object>} events - The events data.
 * @param {Array<object>} guests - The guests data.
 * @param {Array<object>} members - The members data.
 * @param {Array<object>} existingMapRows - The existing map rows.
 */
function mailMappings(events, guests, members, existingMapRows) {
  const ss = getSpreadsheet_();
  const mapSheet = ss.getSheetByName(EVENT_MAP);

  existingMapRows.forEach((mappingRow, idx) => {
    const source = mappingRow[0]; // "Guest" or "Member"
    const eventId = mappingRow[1];
    const personId = mappingRow[2];
    const emailSent = mappingRow[3];

    if (!emailSent) {
      const event = events.find(e => String(e.token).trim() === String(eventId).trim());
      const isGuest = source === "Guest";
      const person = isGuest 
        ? guests.find(g => String(g.token).trim() === String(personId).trim())
        : members.find(m => String(m.token).trim() === String(personId).trim());

      if (!event || !person) {
        Logger.log(`Skipping mapping (eventId: ${eventId}, personId: ${personId}) - not found.`);
        return;
      }

      // Use person's first and last name for greeting
      const subject = `Baruch Dayan Ha-Emet - Death of ${event.deceasedName} - Chevra Kadisha Services Needed`;
      const fullAddress = getAddressFromLocationName_(event.locationName);

      // Generate URL for email
      const webAppUrl = ScriptApp.getService().getUrl(); 
      var urlParam = isGuest ? "g" : "m";
      var personalizedUrl = `${webAppUrl}?${urlParam}=${person.token}`;
      
      // --- Formatted date strings for email ---
      var startDateTimeStr = formattedDateAndTime(event.startDate);
      var endDateTimeStr = formattedDateAndTime(event.endDate); 

      // Compose body with all fields
      const body = `
        Dear ${person.firstName} ${person.lastName},

        Baruch Dayan Ha'Emet. We sadly notify you of the death of ${event.deceasedName}.

        ${event.pronoun} ${event.metOrMeita} is at ${event.locationName} (Address: ${fullAddress}).

        Shmira will start on ${startDateTimeStr} and is scheduled to end for the funeral on ${endDateTimeStr}.

        ${event.personalInfo}
        Volunteer Portal Link (unique to you): ${personalizedUrl}

        As a reminder, only Boulder Chevra Kadisha Member Volunteers can sit shmira after business hours at the mortuaries.
        Log in to the Member Volunteer portal on BoulderChevraKadisha.org for after hours facility access information.

        Thank you for your mitzvah of providing shmira for this member of our community.

        (If you have questions, reply to this email.)
      `;

      try {
        MailApp.sendEmail({
          to: person.email,
          subject: subject,
          body: body,
        });

        // Mark email as sent in map sheet (row indices are 1-based, +2 for header offset)
        var today = new Date;
        mapSheet.getRange(idx + 2, 4).setValue(true); // Email Sent column
        mapSheet.getRange(idx + 2, 5).setValue(today); // Date Sent column
        Logger.log(`Sent email to ${person.email} for event ${event.deceasedName}`);

      } catch (err) {
        Logger.log(`Error emailing ${person.email}: ${err}`);
      }
    }
  });
}


/**
 * Safely opens the spreadsheet.
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} The spreadsheet object.
 * @private
 */
function getSpreadsheet_() {
  if (SPREADSHEET_ID === 'YOUR_GOOGLE_SHEET_ID_HERE') {
    throw new Error("Configuration Error: Please set the SPREADSHEET_ID constant.");
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Looks up the confidential physical address based on the location name (e.g., 'Site A').
 * This function retrieves the secret address stored in ADDRESS_CONFIG.
 * @param {string} locationName The short name (e.g., 'Site A' or 'Site B').
 * @returns {string} The full physical address or a helpful message.
 * @private
 */
function getAddressFromLocationName_(locationName) {
  // Use the locationName to look up the confidential address.
  if (ADDRESS_CONFIG[locationName]) {
    return ADDRESS_CONFIG[locationName];
  }
  
  // If the location is not configured (e.g., 'Virtual Shift', 'Other'), return the name.
  return locationName; 
}




function updateEventGuestTokenMapOrchestrator() {

  // The master workbook
  const ss = getSpreadsheet_();

  // The events sheet
  const eventSheet = ss.getSheetByName(EVENT_FORM_RESPONSES);
  if (!eventSheet) throw new Error(`Sheet not found: ${EVENT_FORM_RESPONSES}`);

  // The guests sheet
  const guestSheet = ss.getSheetByName(GUESTS_SHEET);
  if (!guestSheet) throw new Error(`Sheet not found: ${GUESTS_SHEET}`);

  // The map sheet
  const mapSheet = ss.getSheetByName(GUEST_EVENT_MAP);
  if (!mapSheet) throw new Error(`Sheet not found: ${GUEST_EVENT_MAP}`);

  // The archive map sheet
  const archiveSheet = ss.getSheetByName(ARCHIVE_EVENT_MAP);
  if (!mapSheet) throw new Error(`Sheet not found: ${ARCHIVE_EVENT_MAP}`);


  var events = getEvents(eventSheet);
  var guests = getApprovedGuests(guestSheet);
  var existingMapRows = getExistingMapRows(mapSheet);
  
  syncMappings(events, guests, existingMapRows, mapSheet, archiveSheet);

  // After removals need to refresh the existing Map Rows before printing
  existingMapRows = getExistingMapRows(mapSheet);

  // Now send a mail for any guests and events that have not already been sent the mail
  mailMappings(events, guests, existingMapRows)

}
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

function getExistingMapRows(sheet) {
  var data = sheet.getDataRange().getValues();
  return data.slice(1); // skip headers
}

function syncMappings(events, guests, existingRows, mapSheet, archiveSheet) {
  // Build lookup for existing [eventToken|guestToken] => emailSent
  var mapObj = {};
  existingRows.forEach(function(row) {
    var key = row[0] + '|' + row[1];
    mapObj[key] = row[2];
  });

  // Build required new map keys
  var requiredKeys = new Set();
  var requiredRows = [];
  events.forEach(function(event) {
    guests.forEach(function(guest) {
      if (guest.names.includes(event.deceasedName.toString().trim().toLowerCase())) {
        var key = event.token + "|" + guest.token;
        requiredKeys.add(key);
        var emailSent = mapObj[key] !== undefined ? mapObj[key] : "";
        requiredRows.push([event.token, guest.token, emailSent]);
      }
    });
  });

  // Identify obsolete keys to remove
  var toRemoveIndices = [];
  var toRemoveRows = [];
  existingRows.forEach(function(row, idx) {
    var key = row[0] + '|' + row[1];
    if (!requiredKeys.has(key)) {
      toRemoveIndices.push(idx + 2); // +2 to adjust for header rows in sheet
      toRemoveRows.push(row);
    }
  });

  // Archive obsolete rows before removing them
  if (toRemoveRows.length > 0) {
    archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, toRemoveRows.length, toRemoveRows[0].length).setValues(toRemoveRows);
  }

  // Remove obsolete map rows in reverse order
  toRemoveIndices.reverse().forEach(function(r) {
    mapSheet.deleteRow(r);
  });

  // Add missing rows
  var alreadyPresent = new Set(existingRows.map(function(row) { return row[0] + '|' + row[1]; }));
  var toAdd = requiredRows.filter(function(row) {
    var key = row[0] + '|' + row[1];
    return !alreadyPresent.has(key);
  });
  if (toAdd.length) {
    mapSheet.getRange(mapSheet.getLastRow() + 1, 1, toAdd.length, 3).setValues(toAdd);
  }
}


function mailMappings(events, guests, existingMapRows) {
  const ss = getSpreadsheet_();
  const mapSheet = ss.getSheetByName(GUEST_EVENT_MAP);

  existingMapRows.forEach((mappingRow, idx) => {
    const eventId = mappingRow[0];
    const guestId = mappingRow[1];
    const emailSent = mappingRow[2];

    if (!emailSent) {
      const event = events.find(e => String(e.token).trim() === String(eventId).trim());
      const guest = guests.find(g => String(g.token).trim() === String(guestId).trim());

      if (!event || !guest) {
        Logger.log(`Skipping mapping (eventId: ${eventId}, guestId: ${guestId}) - not found.`);
        return;
      }

      // Use guest's first and last name for greeting
      const subject = `Baruch Dayan Ha-Emet - Death of ${event.deceasedName} - Chevra Kadisha Services Needed`;
      const fullAddress = getAddressFromLocationName_(event.locationName);

      // Generate URL for email

      // The Web App URL is dynamically retrieved at runtime.
      const webAppUrl = ScriptApp.getService().getUrl(); 
      Logger.log("Web App URL detected: " + webAppUrl);

      // Always regenerate the URL to ensure it uses the latest deployment URL
      // NOTE: We consistently use 't' here to maintain uniformity for the generator.
      var personalizedUrl = `${webAppUrl}?t=${guest.token}`;

      // Compose body with all fields
      const body = `
        Dear ${guest.firstName} ${guest.lastName},

        Baruch Dayan Ha'Emet. We sadly notify you of the death of ${event.deceasedName}.

        ${event.pronoun} ${event.metOrMeita} is at ${event.locationName} (Address: ${fullAddress}).

        Shmira will start on ${event.startDate} at ${event.startTime} and is scheduled to end for the funeral on ${event.endDate} at ${event.endTime}.

        ${event.personalInfo}
        Volunteer Portal Link (unique to you): ${personalizedUrl}

        As a reminder, only Boulder Chevra Kadisha Member Volunteers can sit shmira after business hours at the mortuaries.
        Log in to the Member Volunteer portal on BoulderChevraKadisha.org for after hours facility access information.

        Thank you for your mitzvah of providing shmira for this member of our community.

        (If you have questions, reply to this email.)
      `;

      try {
        MailApp.sendEmail({
          to: guest.email,
          subject: subject,
          body: body,
        });

        // Mark email as sent in map sheet (row indices are 1-based, +2 for header offset)
        mapSheet.getRange(idx + 2, 3).setValue(true);
        Logger.log(`Sent email to guest ${guest.email} for event ${event.deceasedName}`);

      } catch (err) {
        Logger.log(`Error emailing ${guest.email}: ${err}`);
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




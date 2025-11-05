


function getMemberInfoByToken_(token) {

  console.log("Getting getMemberInfoByToken_ " + token);
  
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(MEMBERS_SHEET);
    if (!sheet) throw new Error(`Sheet not found: ${MEMBERS_SHEET}`);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Map header names to indices
    var idx = {};
    headers.forEach(function(h, i) { idx[h] = i; });


    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      if (normalizeToken(row[idx['Token']]) === normalizeToken(token)) {
        const info = {
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
          approvals: row[idx['Approvals']],
          events: getEventsForToken_(token),
          rowIndex: i + 1 // Sheet row (1-based)
        };
        //logQCVars_('getMemberInfoByToken_', info);
        return info;
      }
    }
    console.log("Did not find a member with that token");
    return null;
  } catch (e) {
    Logger.log("Error in getMemberInfoByToken_: " + e.toString());
    throw e;
  }
}

function getGuestInfoByToken_(token) {
  console.log("Getting getGuestInfoByToken_ "+token);
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(GUESTS_SHEET);
    if (!sheet) throw new Error(`Sheet not found: ${GUESTS_SHEET}`);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Map header names to indices
    var idx = {};
    headers.forEach(function(h, i) { idx[h] = i; });

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (normalizeToken(row[idx['Token']]) === normalizeToken(token)) {
        const info = {
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
          approvals: row[idx['Approvals']],
          events: getEventsForToken_(token),
          rowIndex: i + 1 // Sheet row (1-based)
        };
        //logQCVars_('getGuestInfoByToken_', info);
        return info;
      }
    }
    console.log("Did not find a guest with that token");
    return null;
  } catch (e) {
    Logger.log("Error in getGuestInfoByToken_: " + e.toString());
    throw e;
  }
}

// SHARED event look up for both guests and members
function getGuestInfoByToken_(guestOrMemberToken) {
  const ss = getSpreadsheet_();
  const eventMapSheet = ss.getSheetByName("Event Map");
  const eventMapData = eventMapSheet.getDataRange().getValues();
  const eventTokenColIdx = eventMapData[0].indexOf("Event Token");
  const guestMemberTokenColIdx = eventMapData[0].indexOf("Guest/Member Token");
  // Find all Event Tokens for this token
  var matchedEventTokens = [];
  for (let i = 1; i < eventMapData.length; i++) {
    if (normalizeToken(eventMapData[i][guestMemberTokenColIdx]) === normalizeToken(guestOrMemberToken)) {
      matchedEventTokens.push(eventMapData[i][eventTokenColIdx]);
    }
  }

  // Now collect ALL Form Responses 1 events that have a Token matching any event token
  const formSheet = ss.getSheetByName("Form Responses 1");
  const formData = formSheet.getDataRange().getValues();
  const formHeaders = formData[0];
  const formTokenIdx = formHeaders.indexOf("Token");
  var events = [];

  for (let i = 1; i < formData.length; i++) {
    if (matchedEventTokens.indexOf(formData[i][formTokenIdx]) > -1) {
      var eventObj = {};
      for (var col = 0; col < formHeaders.length; col++) {
        eventObj[formHeaders[col]] = formData[i][col];
      }
      events.push(eventObj);
    }
  }
  return events;
}

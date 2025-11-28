/**
* -----------------------------------------------------------------
* _server_client_handlers.js
* Chevra Kadisha Server Side Function handler
* Dynamic dispatchers that handle web client calls to the bckLib
* Redirects to the library
* -----------------------------------------------------------------
* _selection_form.js
Version: 1.0.5 * Last updated: 2025-11-09
 * 
 * CHANGELOG v1.0.5:
 *   - Initial implementation of Selection Form.
 * -----------------------------------------------------------------
 */

/**
 * A map of function names (strings) to the actual function objects.
 * This is the secure way to perform dynamic function calls (Dynamic Dispatch).
 */
const HANDLER_FUNCTIONS = {
  // Key (the string name) : Value (the actual function to call)
  "getAvailableShifts": getAvailableShifts,
  "getMyShifts": getMyShifts,
  "getLocations": getLocations,
  "getVolunteerHistory" : getVolunteerHistory,
  "setVolunteerShifts": triggerVolunteerShiftAddition,
  "removeVolunteerShifts" : triggerVolunteerShiftRemoval
};

function serverSideFunctionHandler(functionName, parameter1, parameter2, parameter3) {

  //console.log("parameter1");
  //console.log(parameter1);
  //console.log("parameter2");
  //console.log(parameter2);
  //console.log("parameter3");
  //console.log(parameter3);


  // 1. Get configuration
  const configParameters = setConfigProperties();
  
  // 2. Look up the function in the secure map
  const targetFunction = HANDLER_FUNCTIONS[functionName];

  // 3. Check if the function exists in the map
  if (typeof targetFunction === 'function') {
    try {
      Logger.log("calling server side function:" + functionName);
      var response = targetFunction(configParameters, parameter1, parameter2, parameter3);
      Logger.log("Size of returned  " + JSON.stringify(response).length + " bytes");

    } catch (err) {
      Logger.log("Handler error: " + err);
      throw err; // still throw to get error to client if you want
    }
    Logger.log("Success response returned to client:"+JSON.stringify(response))
    return response;
  } else {
    Logger.log("failure response returned to client")
    Logger.log(`Unknown function name: ${functionName}`);
    return { success: false, message: `Function '${functionName}' not found.` };
  }

}

function cleanForReturn(obj) {
  if (obj instanceof Date) {
    return obj.toISOString(); // Convert Date to string
  } else if (Array.isArray(obj)) {
    return obj.map(cleanForReturn);
  } else if (obj && typeof obj === 'object') {
    const clean = {};
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        if (obj[k] === null) clean[k] = [];
        else clean[k] = cleanForReturn(obj[k]);
      }
    }
    return clean;
  }
  return obj;
}

/**
 * Server-side stub to get available shifts data for "Schedule Shifts" tab.
 */
function getAvailableShifts(sheetInputs, volunteerToken, isMember) {
  // Fetch and return available shifts data filtered or personalized as needed by volunteerToken
  // Example return format: Array of event objects with availableShifts arrays
  const nameOnly = false;
  return cleanForReturn(bckLib.getShifts(sheetInputs, volunteerToken, isMember, SHIFT_FLAGS.AVAILABLE, nameOnly)); 

}

/**
 * Server-side stub to get available shifts data for "Schedule Shifts" tab.
 */
function getMyShifts(sheetInputs, volunteerToken, isMember) {
  // Fetch and return available shifts data filtered or personalized as needed by volunteerToken
  // Example return format: Array of event objects with availableShifts arrays
  const nameOnly = false;
  return cleanForReturn(bckLib.getShifts(sheetInputs, volunteerToken, isMember, SHIFT_FLAGS.SELECTED, nameOnly)); 

}


/**
 * Server-side stub to get mortuary information for the "Mortuary Information" tab.
 * Currently static, but could be extended to pull from Sheets or another data source.
 */
function getLocations(sheetInputs, volunteerToken) {

 try {

    console.log("--- START getLocations ---");

    return {
      "Crist Mortuary": {
        address: "3395 Penrose Place, Boulder, CO 80301",
        phone: "303-442-4411",
        directionsUrl: "https://maps.google.com/?q=3395+Penrose+Place,+Boulder,+CO+80301",
        info: "ADD GEN’ MORTUARY INFO - LOCATION OF SHMIRA ROOM / BATHROOMS"
      },
      "Greenwood & Myers Mortuary": {
        address: "2969 Baseline Road, Boulder, CO 80303",
        phone: "(303) 440-3960",
        directionsUrl: "https://maps.google.com/?q=2969+Baseline+Road,+Boulder,+CO+80303",
        info: "ADD GEN’ MORTUARY INFO - LOCATION OF SHMIRA ROOM / BATHROOMS"
      }
    };

  } catch (error) {
    console.log("FATAL ERROR in getLocations: " + error.toString());
  }

}

/**
 * Server-side stub to get volunteer history and stats for the "Volunteer History" tab.
 */
function getVolunteerHistory(sheetInputs, volunteerToken) {

 try {

    console.log("--- START getVolunteerHistory ---");

    return {
      "YTDHours": 47,
      "YTDNumberDifferentShmira": 156,
      "AnythingElsePercent": "85%",
      "StatsByYear": {
        "2025": {
          "Hours": 12,
          "NumberDifferentShmira": 5,
          "AnythingElse": "tbd"
        }
      },
      "BCKShmiraStats": {
        "TotalRequestedShifts": 100,
        "TotalFilledShifts": 80,
        "CommunityFair": {
          "Filled": 18,
          "Total": 25
        },
        "BeachCleanup": {
          "Filled": 8,
          "Total": 10
        }
      }
    }

  } catch (error) {
    console.log("FATAL ERROR in getVolunteerHistory: " + error.toString());
  };

}

/**
 * Server-side stub to get mortuary locations for the "Mortuary Information" tab.
 * Delegates to bckLib.getLocations using the configured sheetInputs.
 *
 * @param {Object} sheetInputs - Configuration object containing SPREADSHEET_ID and LOCATIONS_SHEET.
 * @returns {{locations:Array<Object>}} - Wrapper object containing an array of locations.
 */
function getLocations(sheetInputs) {
  try {
    console.log("--- START getLocations ---");
    //console.log("sheetInputs: "+ JSON.stringify(sheetInputs));

    // Call into the library function that actually reads the "Locations" sheet
    var locations = bckLib.getLocations(sheetInputs);

    // Wrap in an object so the client can extend the payload later if needed
    return {
      locations: locations
    };

  } catch (error) {
    console.log("FATAL ERROR in getLocations: " + error.toString());
    // Optional: surface a structured error back to the client instead of undefined
    return {
      locations: [],
      error: error.toString()
    };
  }
}



/**
 * Server-side stub to trigger addition of volunteer shifts to sheet.
 */

function triggerVolunteerShiftAddition(sheetInputs, selectedShiftIds, volunteerData) {

  let response = null;

  //logQCVars_("triggerVolunteerShiftAddition.volunteerData", volunteerData)

  try {

    console.log("--- START triggerVolunteerShiftAddition ---");
    console.log ("selectedShiftIds:" + selectedShiftIds);
    console.log ("volunteerData:" + JSON.stringify(volunteerData));

    if (selectedShiftIds && volunteerData) {
      const nameOnly = false;
      response = bckLib.setVolunteerShifts(sheetInputs, selectedShiftIds, volunteerData.name, volunteerData.token);
      if (response) {
          console.log("Volunteer shifts added: Name:" + volunteerData.name);
          bckLib.sendShiftEmail(sheetInputs, volunteerData, selectedShiftIds, "Addition")
          return true;
        } else {
          console.log("Volunteer shifts failed to update: Name:" + volunteerData.name);
          return false;
        }
    }
    else {
        console.log("Volunteer shifts failed to update: Name:" + volunteerData.name);
        return false;
    }

  } catch (error) {
    console.log("FATAL ERROR in triggerVolunteerShiftAddition: " + error.toString());
    return null;
  }
  
}


/**
 * Server-side stub to trigger addition of volunteer shifts to sheet.
 */

function triggerVolunteerShiftRemoval(sheetInputs, selectedShiftIds, volunteerData) {

  let response = null;

  try {

    console.log("--- START triggerVolunteerShiftRemoval ---");
    console.log ("selectedShiftIds:" + selectedShiftIds);
    console.log ("volunteerData:" + JSON.stringify(volunteerData));

    if (selectedShiftIds && volunteerData.token) {
      response = bckLib.removeVolunteerShifts(sheetInputs, selectedShiftIds, volunteerData.name, volunteerData.token);

      if (response) {
          console.log("Volunteer shifts removed: Name:" + volunteerData.name);
          bckLib.sendShiftEmail(sheetInputs, volunteerData, selectedShiftIds, "Removal");
          return true;
        } else {
          console.log("Volunteer shifts failed to remove: Name:" + volunteerData.name);
          return true;
        }
    }
    else {
        console.log("Volunteer shifts failed to remove: Name:" + volunteerData.name);
        return false;
    }

  } catch (error) {
    console.log("FATAL ERROR in triggerVolunteerShiftRemoval: " + error.toString());
    return null;
  }
  
}


/**
 * TBD there is no trigger for this function
 * Sends a confirmation email to the volunteer.
 * @param {string} recipientEmail - The volunteer's email address.
 * @param {object} shift - Object containing shift details (eventName, eventLocation, eventDate, shiftTime).
 * @param {string} actionType - 'Signup' or 'Drop'.
 * @param {string} volunteerName - The name of the volunteer.
 * @param {string} volunteerUrl - The volunteer's unique portal URL.
 */
/**
 * Sends a confirmation email to the volunteer.
 * @param {string} recipientEmail - The volunteer's email address.
 * @param {object} shift - Object containing shift details (eventName, eventLocation, eventDate, shiftTime).
 * @param {string} actionType - 'Signup' or 'Drop'.
 * @param {string} volunteerName - The name of the volunteer.
 * @param {string} volunteerUrl - The volunteer's unique portal URL.
 */
function debugSendShiftEmail(){
  const sheetInputs = setConfigProperties();
  const volunteerData = {
        "name" : "Micha Shapiro",
        "email" : "eshapiro@gmail.com",
        "token" : "4a477c94-ac0c-400b-a0d6-98fc90014fb2",
        "isMember" : true,
        "selectedEvents" : null
          };
  const shifts = "c0cb3134-d576-4071-821f-1e8ac2ad90e8";
  const actionType = "Removal";
  bckLib.sendShiftEmail(sheetInputs, volunteerData, shifts, actionType);

}




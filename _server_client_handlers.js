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

function supplementGetAvailableShifts(volunteerToken, isMember, nameOnly) {
  Logger.log("GetAvailableShifts-volunteerToken:"+ volunteerToken)
  volunteerData = getAvailableShifts(setConfigProperties(), volunteerToken, isMember, nameOnly)

  // ... existing logic ...
  response =  cleanForReturn(volunteerData);
 

  Logger.log("supplementGetAvailableShifts-response:"+ JSON.stringify(response))
  return response;
}

function cleanForReturn(obj) {
  if (Array.isArray(obj)) {
    return obj.map(cleanForReturn);
  } else if (obj && typeof obj === 'object') {
    const clean = {};
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        if (obj[k] === null) clean[k] = []; // Or "" or suitable fallback
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
function getAvailableShifts(sheetInputs, volunteerToken, isMember, nameOnly) {
  // Fetch and return available shifts data filtered or personalized as needed by volunteerToken
  // Example return format: Array of event objects with availableShifts arrays

  try {

    console.log("--- START getAvailableShifts ---");
    console.log("GetAvailableShifts-volunteerToken:"+ volunteerToken)

    var info = null;
    var volunteerData = null;

    if (isMember) {

      info = bckLib.getMemberInfoByToken(sheetInputs, volunteerToken, nameOnly);

      //logQCVars_('Member info', info);
      if (info) {

        var fullName = info.firstName + " " + info.lastName;

        if(fullName.trim = "") {
          fullName = "Volunteer";      
        }

        volunteerData = {
          name: fullName,
          token: volunteerToken,
          isMember: true,
          events: info.events
          // Add more attributes as needed
        };

        console.log(`Member authenticated: ${volunteerData.name} (Token: ${volunteerData.token.substring(0, 5)}...)`);
        return cleanForReturn(volunteerData);

      } else {
        console.log("Member token found but failed validation.");
      }
    } else if (volunteerToken) {
      
      info = bckLib.getGuestInfoByToken(sheetInputs, volunteerToken, nameOnly);

      var fullName = info.firstName + " " + info.lastName;

      if(fullName.trim = "") {
        fullName = "Volunteer";      
      }

      //logQCVars_('Guest info', info);
      if (info) {

        var fullName = info.firstName + " " + info.lastName;

        if(fullName.trim = "") {
          fullName = "Volunteer";      
        }

        volunteerData = {
          name: fullName,
          token: volunteerToken,
          isMember: false,
          events: info.events
          // Add more attributes as needed
        };

        console.log(`Guest authenticated: ${volunteerData.name} (Token: ${volunteerData.token.substring(0, 5)}...)`);
        return cleanForReturn(volunteerData);

      } else {
        console.log("Guest token found but failed validation.");
        return null;
      }
    } else {
      console.log("No member or guest token found in URL parameters.");
      return null;
    }

  } catch (error) {
    console.log("FATAL ERROR in getAvailableShifts: " + error.toString());
    return null;
  }

}

/**
 * Server-side stub to get volunteer's signed up shifts for "My Shifts" tab.
 */
function getMyShifts(sheetInputs, volunteerToken, isMember=false ) {

  try {

    console.log("--- START getMyShifts ---");

    // Note: To minimize changes to backend, keeping this function same as it was before
    const volunteerData = getAvailableShifts(sheetInputs, volunteerToken, isMember)
    if (volunteerData != null){
      volunteerData.events = volunteerData.events.filter(event => Array.isArray(event.selectedShifts) && event.selectedShifts.length > 0)
      return cleanForReturn(volunteerData);
    }
    console.log("FATAL ERROR in getMyShifts: No data returned" );
    return null;

  } catch (error) {
    console.log("FATAL ERROR in getMyShifts: " + error.toString());
  }
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
 * Server-side stub to trigger addition of volunteer shifts to sheet.
 */

function triggerVolunteerShiftAddition(sheetInputs, selectedShiftIds, volunteerName, volunteerToken) {

  let response = null;

  try {

    console.log("--- START triggerVolunteerShiftAddition ---");

    if (selectedShiftIds && volunteerToken) {
      response = bckLib.setVolunteerShifts(sheetInputs, selectedShiftIds, volunteerName, volunteerToken);
      if (response) {
          console.log("Volunteer shifts added: Name:" + volunteerName);
          return true;
        } else {
          console.log("Volunteer shifts failed to update: Name:" + volunteerName);
          return true;
        }
    }
    else {
        console.log("Volunteer shifts failed to update: Name:" + volunteerName);
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

function triggerVolunteerShiftRemoval(sheetInputs, shiftIds, volunteerToken) {

  let response = null;

  try {

    console.log("--- START triggerVolunteerShiftRemoval ---");

    if (selectedShiftIds && volunteerToken) {
      response = bckLib.removeVolunteerShifts(sheetInputs, shiftIds, volunteerToken);
      if (response) {
          console.log("Volunteer shifts removed: Token:" + volunteerToken);
          return true;
        } else {
          console.log("Volunteer shifts failed to remove: Token:" + volunteerToken);
          return true;
        }
    }
    else {
        console.log("Volunteer shifts failed to remove: Token:" + volunteerToken);
        return false;
    }

  } catch (error) {
    console.log("FATAL ERROR in triggerVolunteerShiftRemoval: " + error.toString());
    return null;
  }
  
}


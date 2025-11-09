/**
* -----------------------------------------------------------------
* _webAppHandler.js
* Chevra Kadisha Shifts Scheduler
* Web App Handler
* -----------------------------------------------------------------
* _webAppHandler.js
 * Version: 1.0.1
 * Last updated: 2025-10-30
 * 
 * CHANGELOG v1.0.1:
 *   - Initial implementation of getCurrentEventInfo_.
 *   - Added logging and error handling.
 *   - Added event information retrieval.
 *   - Added shift information retrieval.
 *   - Added email sending.
 *   - Added error handling and logging.
 *   - Added logging and error handling.
 * Web App Handler
 * -----------------------------------------------------------------
 */

// -------------------------------------------------------------------
// --- EMAIL FUNCTIONALITY UPDATED ---
// -------------------------------------------------------------------

/**
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
function sendShiftEmail(recipientEmail, shift, actionType, volunteerName, volunteerUrl) {
  const subject = `Shift ${actionType} Confirmation: ${shift.eventName}`;
  
  // Look up the full address for the email body
  const fullAddress = getAddressFromLocationName_(shift.eventLocation);
  
  const body = `
    Dear ${volunteerName},

    This is an automatic confirmation that your request to ${actionType.toLowerCase()} the following shift has been processed successfully:

    Shift Details:
    - Event: ${shift.eventName}
    - Location: ${shift.eventLocation}
    - Address: ${fullAddress}
    - Date: ${shift.eventDate}
    - Time: ${shift.shiftTime}

    If you need to cancel or change your confirmation. Go to Your Volunteer Portal Link: ${volunteerUrl}. Remember, this link is unique to you. Please do not share it.
    
    Thank you for providing this mitzvah.

    
  `;

  try {
    // Check if the recipient email is valid (basic check)
    if (!recipientEmail || !String(recipientEmail).includes('@')) {
       Logger.log(`Skipping email: Invalid recipient email address: ${recipientEmail}`);
       return;
    }
    
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: body
    });
    Logger.log(`Email sent successfully for ${actionType} to ${recipientEmail}`);
  } catch (e) {
    Logger.log(`ERROR sending email for ${actionType}: ${e.toString()}`);
  }
}

function setConfigProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();
  
  scriptProperties.setProperty('DEBUG', 'true');
  
  const addressConfig = {
    'Crist Mortuary': '3395 Penrose Pl, Boulder, CO 80301',
    'Greenwood & Myers Mortuary': '2969 Baseline Road, Boulder, CO 80303'
  };
  scriptProperties.setProperty('ADDRESS_CONFIG', JSON.stringify(addressConfig));  
  
  const sheetInputs = {
    SPREADSHEET_ID: '1cCouQRRpEN0nUhN45m14_z3oaONo7HHgwyfYDkcu2mw',
    EVENT_FORM_RESPONSES: 'Form Responses 1',
    SHIFTS_MASTER_SHEET: 'Shifts Master',
    GUESTS_SHEET: 'Guests',
    MEMBERS_SHEET: 'Members',
    EVENT_MAP: 'Event Map',
    ARCHIVE_EVENT_MAP: 'Archive Event Map'
  };
  scriptProperties.setProperty('SHEET_INPUTS', JSON.stringify(sheetInputs));
}

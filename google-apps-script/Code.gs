/**
 * T-Mobile Fiber signup — Google Apps Script Web App.
 *
 * Deploy: Extensions → Apps Script → paste this file → Deploy → New deployment
 *   Type: Web app | Execute as: Me | Who has access: Anyone
 * Copy the Web app URL and paste it into src/lib/signup-config.ts.
 */

const SHEET_NAME = 'Submissions';

const COLUMNS = [
  'timestampEST',
  'planSelected',
  'fullName',
  'fullFormattedAddress',
  'streetAddress',
  'aptUnit',
  'city',
  'state',
  'zip',
  'phone',
  'email',
  'dob',
  'pin',
  'preferredInstallDate',
  'preferredInstallTime',
  'consent',
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME)
      || SpreadsheetApp.getActive().insertSheet(SHEET_NAME);

    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp EST',
        'Plan Selected',
        'Full Name',
        'Full Formatted Address',
        'Street Address',
        'Apt / Unit',
        'City',
        'State',
        'ZIP',
        'Phone',
        'Email',
        'DOB',
        '6 Digit PIN',
        'Preferred Install Date',
        'Preferred Install Time',
        'Consent',
      ]);
    }

    const row = COLUMNS.map(function (k) { return body[k] || ''; });
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'tmo-fiber-signup' }))
    .setMimeType(ContentService.MimeType.JSON);
}

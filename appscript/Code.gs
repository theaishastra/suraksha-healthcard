/**
 * Sree Suraksha Family Health Card — Email Automation
 * ====================================================
 * Deploy this as a Google Apps Script Web App:
 *   1. Go to https://script.google.com → New Project → paste this file in as Code.gs
 *   2. Project Settings → note the account you're logged in as (emails send FROM this Gmail).
 *   3. Deploy → New deployment → type "Web app".
 *        Execute as:      Me
 *        Who has access:  Anyone
 *   4. Copy the deployment URL (ends in /exec) into js/config.js as APPSCRIPT_EMAIL_URL.
 *   5. Run once manually (select doPost, Run) so Google prompts you to authorize
 *      Gmail + UrlFetch permissions — required before the Web App works for real calls.
 *
 * No shared secret: anyone who has this Web App URL can trigger a send if they
 * also supply a valid Supabase card URL. That's an acceptable tradeoff here
 * since the URL isn't published anywhere, but keep it out of public repos/pages.
 *
 * Quota note: GmailApp free Gmail accounts get ~100 emails/day; Google Workspace
 * accounts get ~1500/day. That's the ceiling on registrations/day with this setup.
 */

var FROM_NAME = 'Sree Suraksha Hospital';

function doPost(e) {
  var response;
  try {
    var data = JSON.parse(e.postData.contents);

    var fullName = data.fullName;
    var email = data.email;
    var memberId = data.memberId;
    var cardUrl = data.cardDownloadUrl;

    if (!email || !memberId || !cardUrl) {
      return jsonResponse({ success: false, error: 'Missing required fields' });
    }

    var pdfBlob = UrlFetchApp.fetch(cardUrl).getBlob()
      .setName('SreeSuraksha_HealthCard_' + memberId + '.pdf');

    var subject = 'Your Sree Suraksha Family Health Card – ' + memberId;
    var htmlBody = buildEmailHtml(fullName, memberId, cardUrl);
    var plainBody = 'Dear ' + (fullName || 'Member') + ',\n\n' +
      'Your Sree Suraksha Family Health Card has been generated. Member ID: ' + memberId + '.\n' +
      'The card is attached as a PDF. You can also download it here: ' + cardUrl + '\n\n' +
      'Sree Suraksha Hospital';

    GmailApp.sendEmail(email, subject, plainBody, {
      htmlBody: htmlBody,
      attachments: [pdfBlob],
      name: FROM_NAME,
    });

    response = { success: true };
  } catch (err) {
    response = { success: false, error: err.message };
  }
  return jsonResponse(response);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildEmailHtml(fullName, memberId, cardUrl) {
  var name = fullName || 'there';
  return ''
    + '<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#222;">'
    + '  <div style="background:#0f7a5c;padding:24px;text-align:center;border-radius:8px 8px 0 0;">'
    + '    <h1 style="color:#fff;margin:0;font-size:20px;">Sree Suraksha Hospital</h1>'
    + '    <p style="color:#d7f5ea;margin:4px 0 0;font-size:14px;">Family Health Card</p>'
    + '  </div>'
    + '  <div style="border:1px solid #e2e2e2;border-top:none;padding:24px;border-radius:0 0 8px 8px;">'
    + '    <p>Dear ' + escapeHtml(name) + ',</p>'
    + '    <p>Thank you for registering with <strong>Sree Suraksha Hospital</strong>. Your Family Health Card has been generated successfully and is attached to this email as a PDF.</p>'
    + '    <table style="width:100%;border-collapse:collapse;margin:16px 0;">'
    + '      <tr><td style="padding:6px 0;color:#666;">Member ID</td><td style="padding:6px 0;font-weight:bold;">' + escapeHtml(memberId) + '</td></tr>'
    + '    </table>'
    + '    <p style="text-align:center;margin:24px 0;">'
    + '      <a href="' + cardUrl + '" style="background:#0f7a5c;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;">Download Your Card</a>'
    + '    </p>'
    + '    <p>Your card gives you and your family access to:</p>'
    + '    <ul style="line-height:1.8;">'
    + '      <li>20% discount on OP Consultation</li>'
    + '      <li>20% discount on OP Investigations</li>'
    + '      <li>10% discount on IP Cash Tariff</li>'
    + '      <li>One-step room upgradation on IP admission</li>'
    + '      <li>10% discount on Health Check-Up packages</li>'
    + '      <li>Free ambulance service within 10 km of the hospital</li>'
    + '    </ul>'
    + '    <p>Please present this card (digital or printed) at the hospital reception to avail your benefits.</p>'
    + '    <p style="margin-top:24px;">Warm regards,<br><strong>Sree Suraksha Hospital</strong><br>7731083108 | 9030808066 | 7729884000</p>'
    + '  </div>'
    + '</div>';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

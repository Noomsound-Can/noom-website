/**
 * GetYourGuide booking emails -> noomsound.studio
 *
 * Runs on the Google account that receives the GetYourGuide mail
 * (noomsoundstudio@gmail.com). Every run it looks for new booking emails, reads the
 * reference, date, time, guest count and name out of them, and posts each one to the
 * site. The site creates the booking and writes it into the Noom Bookings sheet.
 *
 * Setup, once:
 *   1. script.google.com -> New project -> paste this file.
 *   2. Put the same token you set as GYG_INTAKE_TOKEN in Cloudflare into TOKEN below.
 *   3. Run importGygBookings once by hand and allow the permissions it asks for.
 *   4. Triggers (clock icon) -> Add trigger -> importGygBookings, time driven,
 *      minutes timer, every 10 minutes.
 *
 * An email that goes in gets the label gyg-imported. One the site refuses gets
 * gyg-problem instead, so nothing is silently lost and nothing is imported twice.
 */

var SITE = 'https://www.noomsound.studio/api/intake/gyg';
var TOKEN = 'PASTE_THE_SAME_TOKEN_AS_CLOUDFLARE';

var QUERY = 'from:do-not-reply@notification.getyourguide.com subject:"Booking -" ' +
            '-label:gyg-imported -label:gyg-problem newer_than:60d';

function importGygBookings() {
  var done = label_('gyg-imported');
  var bad = label_('gyg-problem');
  var threads = GmailApp.search(QUERY, 0, 20);

  threads.forEach(function (thread) {
    var messages = thread.getMessages();
    var ok = false;
    var trouble = false;

    messages.forEach(function (msg) {
      if (msg.getSubject().indexOf('Booking - ') !== 0) return;
      var booking = parseBooking_(msg.getBody());
      if (!booking) { trouble = true; return; }
      var result = post_(booking);
      if (result.ok) ok = true; else trouble = true;
    });

    if (ok && !trouble) thread.addLabel(done);
    else if (trouble) thread.addLabel(bad);
  });
}

/** Pulls the five fields out of the email body. Returns null if any is missing. */
function parseBooking_(html) {
  var text = String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ');

  var ref = /Reference number\s*(GYG[A-Z0-9]{4,24})/i.exec(text);
  var when = /Date\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4}),?\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(text);
  var who = /Main customer\s*(.+?)\s*customer-[a-z0-9]+@reply\.getyourguide\.com/i.exec(text);
  if (!ref || !when || !who) return null;

  var guests = 0;
  var pax = /(\d+)\s*x\s*(Adults?|Child(?:ren)?|Infants?|Youths?|Seniors?|Students?)/gi;
  var hit;
  while ((hit = pax.exec(text)) !== null) guests += Number(hit[1]);
  if (!guests) return null;

  return {
    ref: ref[1].toUpperCase(),
    date: isoDate_(when[1], Number(when[2]), Number(when[3])),
    time: time24_(Number(when[4]), when[5], when[6]),
    name: who[1].replace(/\s+/g, ' ').trim(),
    party_size: guests
  };
}

function isoDate_(monthName, day, year) {
  var months = ['january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december'];
  var m = months.indexOf(String(monthName).toLowerCase()) + 1;
  if (!m) return '';
  return year + '-' + pad_(m) + '-' + pad_(day);
}

function time24_(hour, minute, ampm) {
  var h = hour % 12;
  if (String(ampm).toUpperCase() === 'PM') h += 12;
  return pad_(h) + ':' + minute;
}

function pad_(n) {
  return (n < 10 ? '0' : '') + n;
}

function post_(booking) {
  var res = UrlFetchApp.fetch(SITE, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-intake-token': TOKEN },
    payload: JSON.stringify(booking),
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  var body = res.getContentText();
  Logger.log(booking.ref + ' -> ' + code + ' ' + body);
  return { ok: code >= 200 && code < 300, code: code, body: body };
}

function label_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

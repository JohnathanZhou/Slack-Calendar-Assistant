var google = require('googleapis');
var calendar = google.calendar('v3');
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
mongoose.connect(connect);
var models = require('./models/models');
var Meeting = models.Meeting;

function addMeeting (web, oauth2Client, date, time, subject) {
  // make a new meeting model in mLab
  // new Meeting ({
  //   day: ,
  //   time: ,
  //   invitees: ,
  //   subject: ,
  //   location: ,
  //   length: ,
  //   status: ,
  //   requesterID:
  // }).save();

  // make a new meeting event to be inserted onto Google Calendar
  var event = {
    'summary': subject,
    'start': {
      'dateTime': date + "T" + time,
      'timeZone': 'America/Los_Angeles',
    },
    'end': {
      'dateTime': date + "T17:30:00",
      'timeZone': 'America/Los_Angeles',
    },
    // 'recurrence': [
    //   'RRULE:FREQ=DAILY;COUNT=2'
    // ],
    // 'attendees': [
    //   {'email': ''},
    //   {'email': ''},
    // ],
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 24 * 60},
        {'method': 'popup', 'minutes': 10},
      ],
    },
  };
  calendar.events.insert({
    auth: oauth2Client,
    calendarId: 'primary',
    resource: event,
  }, function(err, event) {
    if (err) {
      web.chat.postMessage(message.channel, "There is an error creating meeting " + err);
      return;
    }
    web.chat.postMessage(message.channel, "Nice! Your meeting has been created at " + event.htmlLink);
  });
}

module.exports = addMeeting;

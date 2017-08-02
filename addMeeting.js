var google = require('googleapis');
var calendar = google.calendar('v3');
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
mongoose.connect(connect);
var models = require('./models/models');
var Meeting = models.Meeting;

function addMeeting () {
  // split the date into the right format for the end.date
  // var day = new Date(date)
  // var tomorrow = new Date();
  // tomorrow.setDate(day.getDate()+1);
  // var endYear = tomorrow.getFullYear()
  // var endMonth = tomorrow.getMonth()
  // endMonth = parseInt(endMonth) + 1
  // if (parseInt(endMonth) < 10) {
  //   endMonth = '0'+endMonth
  // }
  // var endDay = tomorrow.getDate()
  // endDay = parseInt(endDay) + 1
  // if (parseInt(endDay) < 10) {
  //   endDay = '0'+endDay
  // }

  // make a new meeting model in mLab
  new Meeting ({
    day: ,
    time: ,
    invitees: ,
    subject: ,
    location: ,
    length: ,
    status: ,
    requesterID:
  }).save();

  // make a new meeting event to be inserted onto Google Calendar
  var event = {
    'summary': ,
    'location': || '',
    'description': || '',
    'start': {
      'dateTime': ,
      'timeZone': 'America/Los_Angeles',
    },
    'end': {
      'dateTime': ,
      'timeZone': 'America/Los_Angeles',
    },
    // 'recurrence': [
    //   'RRULE:FREQ=DAILY;COUNT=2'
    // ],
    'attendees': [
      {'email': ''},
      {'email': ''},
    ],
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

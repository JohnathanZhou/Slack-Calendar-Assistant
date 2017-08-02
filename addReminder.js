var google = require('googleapis');
var calendar = google.calendar('v3');
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
mongoose.connect(connect);
var models = require('./models/models');
var Task = models.Task;

function addReminder (web, date, subject, oauth2Client, message, id) {
  // split the date into the right format for the end.date
  var day = new Date(date)
  var tomorrow = new Date();
  tomorrow.setDate(day.getDate()+1);
  var endYear = tomorrow.getFullYear()
  var endMonth = tomorrow.getMonth()
  endMonth = parseInt(endMonth) + 1
  if (parseInt(endMonth) < 10) {
    endMonth = '0'+endMonth
  }
  var endDay = tomorrow.getDate()
  endDay = parseInt(endDay) + 1
  if (parseInt(endDay) < 10) {
    endDay = '0'+endDay
  }

  // make a new task model in mLab
  new Task ({
    subject: subject,
    day: date,
    //eventID: String,
    requesterID: id
  }).save();

  // make a new event to be inserted onto Google Calendar
  var event = {
    'summary': subject,
    'start': {
      'date': date,
      // startYear+'-'+startMonth+'-'+startDay
      'timeZone': 'America/Los_Angeles',
    },
    'end': {
      'date': endYear+'-'+endMonth+'-'+endDay,
      // endYear+'-'+endMonth+'-'+endDay
      'timeZone': 'America/Los_Angeles',
    },
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 24 * 60},
        {'method': 'popup', 'minutes': 24 * 60},
      ],
    }
  };
  calendar.events.insert({
    auth: oauth2Client,
    calendarId: 'primary',
    resource: event,
  }, function(err, event) {
    if (err) {
      web.chat.postMessage(message.channel, "There is an error creating schedule " + err);
      return;
    }
    web.chat.postMessage(message.channel, "Nice! Your event has been created at " + event.htmlLink);
    res.end();
  });
}

module.exports = addReminder;

var google = require('googleapis');
var calendar = google.calendar('v3');
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
mongoose.connect(connect);
var models = require('./models/models');
var Meeting = models.Meeting;

function addMeeting (web, message, oauth2Client, date, time, subject, userID, inviteeID, meetingEmails) {

  var parsedTime = time.split(':');
  var endTimeMin = 0;
  var endHour = 0;
  if (parseInt(parsedTime[1]) === 30) {
    endHour = parsedTime[0] + 1;
  } else if (parseInt(parsedTime[1]) > 30) {
    endTimeMin = parseInt(parsedTime[1]) + 30 - 60;
    endHour = parseInt(parsedTime[0]) + 1;
  } else {
    endTimeMin = parseInt(parsedTime[1]) + 30;
    endHour = parseInt(parsedTime[0]);
  }

  if (endHour < 10) {
    endHour = "0" + endHour;
  }
  if (endTimeMin < 10) {
    endTimeMin = "0" + endTimeMin;
  }

  var emailArray = meetingEmails.map(function(eachEmail) {
    return {'email': eachEmail};
  });

  // make a new meeting model in mLab
  // new Meeting ({
  //   day: date,
  //   time: time,
  //   invitees: ,
  //   subject: subject,
  //   length: 30,
  //   requesterID: userID
  // }).save();

  // make a new meeting event to be inserted onto Google Calendar
  var event = {
    'summary': subject,
    'start': {
      'dateTime': date + "T" + time,
      'timeZone': 'America/Los_Angeles',
    },
    'end': {
      'dateTime': date + "T" + endHour + ":" + endTimeMin + ":00",
      'timeZone': 'America/Los_Angeles',
    },
    'attendees': emailArray,
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
      console.log("err connecting to calendar", err);
      return;
    }
    if (userID === inviteeID) {
      web.chat.postMessage(message.channel, "Nice! Your meeting has been created at " + event.htmlLink);
    }
  });
}

module.exports = addMeeting;

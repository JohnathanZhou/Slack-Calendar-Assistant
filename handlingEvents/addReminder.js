var calendar = google.calendar('v3');

var addReminder = function(auth, task) {
  var tomorrow = new Date();
  tomorrow.setDate(task.day.getDate() + 1);
  var event = {
    'summary': task.subject,
    'start': {
      'date': task.day,
      'timeZone': 'America/Los_Angeles',
    },
    'end': {
      'date': tomorrow,
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
    auth: auth,
    calendarId: 'primary',
    resource: event,
  }, function(err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
      return;
    }
    console.log('Event created: %s', event.htmlLink);
    res.redirect('/');
  });
};

module.exports = addReminder;

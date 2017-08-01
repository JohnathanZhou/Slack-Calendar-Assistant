var express = require('express');
var router = express.Router();
var models = require('../models/models');
var User = models.User;
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var calendar = google.calendar('v3');
var oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT
);

router.get('/', function(req, res) {
  res.render('home');
})

router.get('/connect', function(req, res, next) {
  //if (req.query.auth_id) {
    var url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/plus.me',
        'https://www.googleapis.com/auth/calendar'
      ],
      // state: encodeURIComponent(JSON.stringify({
      //   auth_id: req.query.auth_id
      // }))
    });
    res.redirect(url);
  //} else {
    //res.send(404);
  //}
});

router.get('/auth', function(req, res) {
  //var id = JSON.parse(decodeURIComponent(req.query.state));
  var code = req.query.code;
  oauth2Client.getToken(code, function(err, tokens) {
    if (! err) {
      oauth2Client.setCredentials(tokens);
      // User.findByIdAndUpdate(id, {google: tokens}, function(err) {
      //   // use rtm to send message err back to user
      // })
      var event = {
        'summary': 'Google I/O 2015',
        'location': '800 Howard St., San Francisco, CA 94103',
        'description': 'A chance to hear more about Google\'s developer products.',
        'start': {
          'dateTime': '2017-05-28T09:00:00-07:00',
          'timeZone': 'America/Los_Angeles',
        },
        'end': {
          'dateTime': '2017-05-28T17:00:00-07:00',
          'timeZone': 'America/Los_Angeles',
        },
        'recurrence': [
          'RRULE:FREQ=DAILY;COUNT=2'
        ],
        'attendees': [
          {'email': 'lpage@example.com'},
          {'email': 'sbrin@example.com'},
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
          console.log('There was an error contacting the Calendar service: ' + err);
          return;
        }
        console.log('Event created: %s', event.htmlLink);
      });
    }
  })
  res.redirect('/');
})

module.exports = router;

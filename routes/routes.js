var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
var bodyParser = require('body-parser');
var google = require('googleapis');
var checkToken = require('../checkToken');
var OAuth2 = google.auth.OAuth2;
var calendar = google.calendar('v3');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var models = require('../models/models');
var User = models.User;
var Reminder = models.Reminder;
var Task = models.Task;
var Meeting = models.Meeting;
mongoose.connect(connect);

function allRoutes (rtm, web, message) {
  router.get('/connect', function(req, res, next) {
    if (req.query.auth_id) {
      var oauth2Client = new OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.DOMAIN + "/auth"
      );
      var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
          'https://www.googleapis.com/auth/plus.me',
          'https://www.googleapis.com/auth/calendar'
        ],
        state: encodeURIComponent(JSON.stringify({
          auth_id: req.query.auth_id
        }))
      });
      res.redirect(url);
    } else {
      res.status(404).send("Auth_id is not included in query.");
    }
  });

  router.get('/auth', function(req, res) {
    var id = JSON.parse(decodeURIComponent(req.query.state));
    var realId = id.auth_id
    var code = req.query.code;
    var oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.DOMAIN + "/auth"
    );
    oauth2Client.getToken(code, function(err, tokens) {
      if (! err) {
        console.log(id);
        User.findByIdAndUpdate(realId, {google: tokens}, {new: true},  function(err, user) {
          if (err) {
            console.log('This is your ERROR: ', err);
          } else {
            oauth2Client.setCredentials({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token
            });
            web.chat.postMessage(message.channel, "Congratulations! You've been authenticated with Google Calendar. Remind away.");
            res.redirect('/auth/success');
          }
        })
      }
    })
  });

  router.get('/auth/success', function(req, res) {
    res.send("Congratulations! Authenticate with Google Calendar success!")
  });

  router.post('/interactive', urlencodedParser, (req, res) => {
    var parsed = JSON.parse(req.body.payload);
    var response = parsed.actions[0].value;
    var oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.DOMAIN + "/auth"
    );
    User.findOne({slackID: parsed.user.id}, function(err, user) {
      if (err) {
        console.log('error:', err);
      }
      else {
        oauth2Client.refreshAccessToken(function(err, tokens) {
          oauth2Client.setCredentials({
          access_token: user.google.access_token,
          refresh_token: user.google.refresh_token
        })})
        var text = parsed.original_message.text
        var split = text.split(':')
        var subject = split[1].split(' ')
        subject.pop()
        subject.shift()
        subject = subject.join(' ')
        var date = split[2].split(' ')[1]
        if (response === 'scheduleReminder') {
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
            requesterID: parsed.user.id
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
      }
    })
  })
  return router;
}

module.exports = allRoutes;

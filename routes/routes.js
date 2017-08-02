var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
var bodyParser = require('body-parser');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var models = require('../models/models');
var User = models.User;
var Reminder = models.Reminder;
var Task = models.Task;
var Meeting = models.Meeting;
var addReminder = require('../addReminder');
// var addMeeting = require('../addMeeting');
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

    // find the current bot user's mlab account
    User.findOne({slackID: parsed.user.id}, function(err, user) {
      if (err) {
        console.log('error:', err);
      }
      else {
        // this is for the current user of the bot.
        oauth2Client.setCredentials({
          access_token: user.google.access_token,
          refresh_token: user.google.refresh_token
        })

        // if the token expired, refresh the tokens and set the new tokens to the user model
        var rightNow = new Date();
        if (user.google.expiry_date - rightNow.getTime() <= 0 ) {
          oauth2Client.refreshAccessToken(function(err, tokens) {
            console.log("this is new tokens", tokens);
            oauth2Client.setCredentials({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token
            });
            user.google = tokens;
            user.save();
          });
        }

        var text = parsed.original_message.text;
        var split = text.split(':');
        var subject = split[1].split(' ');
        subject.pop();
        subject.shift();
        subject = subject.join(' ');
        var date = split[2].split(' ')[1];

        if (response === 'scheduleReminder') {
          addReminder(web, date, subject, oauth2Client, message, parsed.user.id);
          var newMsg = JSON.parse(req.body.payload).original_message;
          newMsg.attachments.pop();
          res.send(newMsg)
        } else if (response === 'scheduleMeeting') {
          // get the attendees and find them in the database. after we find each one set the oauth2Client to their token and then addMeeting

          // if the invitee's token expired refresh their token.
          // oauth2Client.setCredentials({
          //   access_token: user.google.access_token,
          //   refresh_token: user.google.refresh_token
          // })
          //
          // // if the token expired, refresh the tokens and set the new tokens to the invitee user model
          // var rightNow = new Date();
          // if (user.google.expiry_date - rightNow.getTime() <= 0 ) {
          //   oauth2Client.refreshAccessToken(function(err, tokens) {
          //     console.log("this is new tokens", tokens);
          //     oauth2Client.setCredentials({
          //       access_token: tokens.access_token,
          //       refresh_token: tokens.refresh_token
          //     });
          //     user.google = tokens;
          //     user.save();
          //   });
          // }
          addReminder();
        } else if (response === 'dontScheduleReminder' || response === 'dontScheduleMeeting') {
          var newMsg = JSON.parse(req.body.payload).original_message;
          newMsg.attachments.pop();
          res.send(newMsg)
          web.chat.postMessage(message.channel, "You've cancelled the request");
        }
      }
    })
  })
  return router;
}

module.exports = allRoutes;

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
var addMeeting = require('../addMeeting');
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
            oauth2Client.setCredentials({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token
            });
            user.google = tokens;
            user.save();
          });
        }

        if (response === 'scheduleReminder') {
          // parse the time and date and subject for the reminder
          var text = parsed.original_message.text;
          var split = text.split(':');
          var subject = split[1].split(' ');
          subject.pop();
          subject.shift();
          subject = subject.join(' ');
          var date = split[2].split(' ')[1];

          addReminder(web, date, subject, oauth2Client, message, parsed.user.id);
          var newMsg = JSON.parse(req.body.payload).original_message;
          newMsg.attachments.pop();
          res.send(newMsg)

        } else if (response === 'scheduleMeeting') {
          // parse invitees, time, date, and subject for the meeting
          var text = parsed.original_message.text;
          var split = text.split('=');
          var subject = split[1].split(' ');
          subject.pop();
          subject = subject.join(' ');

          var inviteesArray = split[2].split(' ');
          var invitees = [];
          inviteesArray.forEach(function(word) {
            if (word.indexOf('@') !== -1) {
              invitees.push(word);
            }
          });
          var inviteesID = [];
          invitees.forEach(function(word) {
            inviteesID.push(word.slice(5, word.length));
          })

          var date = split[3].split(' ')[0];
          var time = split[4].split(' ')[0];

          // send it for the current actual bot user
          addMeeting(web, message, oauth2Client, date, time, subject, parsed.user.id, parsed.user.id);

          inviteesID.forEach(function(slackID) {
            User.findOne({slackID: slackID}, function (err, invitee) {
              if (err) {
                console.log(err);
              } else if (invitee) {
                var oauth2Client = new OAuth2(
                  process.env.GOOGLE_CLIENT_ID,
                  process.env.GOOGLE_CLIENT_SECRET,
                  process.env.DOMAIN + "/auth"
                );
                console.log('this is invitee', invitee);
                console.log("this is cred before", oauth2Client);
                oauth2Client.setCredentials({
                  access_token: invitee.google.access_token,
                  refresh_token: invitee.google.refresh_token
                });
                console.log("this is cred after", oauth2Client);
                // if the token expired, refresh the tokens and set the new tokens to the user model
                var rightNow = new Date();
                if (invitee.google.expiry_date - rightNow.getTime() <= 0 ) {
                  oauth2Client.refreshAccessToken(function(err, tokens) {
                    oauth2Client.setCredentials({
                      access_token: tokens ? tokens.access_token : invitee.google.access_token,
                      refresh_token: tokens? tokens.refresh_token : invitee.google.refresh_token
                    });
                    invitee.google = tokens;
                    invitee.save(function(err, invitee) {
                      if (err) {
                        console.log(err);
                        return;
                      }
                      addMeeting(web, message, oauth2Client, date, time, subject, parsed.user.id, slackID);
                    });
                  });
                } else {
                  addMeeting(web, message, oauth2Client, date, time, subject, parsed.user.id, slackID);
                }
              }
            })
          })

          var newMsg = JSON.parse(req.body.payload).original_message;
          newMsg.attachments.pop();
          res.send(newMsg);

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

var express = require('express');
var router = express.Router();
var models = require('../models/models');
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
var User = models.User;
var bodyParser = require('body-parser');
var google = require('googleapis');
var checkToken = require('../checkToken');
var OAuth2 = google.auth.OAuth2;

var urlencodedParser = bodyParser.urlencoded({ extended: false });


mongoose.connect(connect);

function allRoutes (rtm, web) {
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
              refresh_token: tokens.fresh_token
            });
            res.redirect('/auth/success');
          }
        })
      }
    })
  });

  router.get('/auth/success', function(req, res) {
    res.send("Congratulations! Authenticate with Google Calendar success!")
  });

  // router.post('/interactive', urlencodedParser, (req, res) => {
  //   console.log('this is req.body', req.body);
  //   var parsed = JSON.parse(req.body.payload);
  //   var response = parsed.actions[0].value;
  //   if (response === 'scheduleReminder') {
  //     console.log('wassuh');
  //   }
    // var tomorrow = new Date();
    // tomorrow.setDate(task.day.getDate() + 1);
    // var event = {
    //   'summary': '',
    //   'start': {
    //     'date': '',
    //     'timeZone': 'America/Los_Angeles',
    //   },
    //   'end': {
    //     'date': '',
    //     'timeZone': 'America/Los_Angeles',
    //   },
    //   'reminders': {
    //     'useDefault': false,
    //     'overrides': [
    //       {'method': 'email', 'minutes': 24 * 60},
    //       {'method': 'popup', 'minutes': 24 * 60},
    //     ],
    //   }
    // };
    //
  // })
  // })
  return router;
}



module.exports = allRoutes;

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

var oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.DOMAIN + "/auth"
);

function allRoutes (rtm, web) {
  router.get('/connect', function(req, res, next) {
    if (req.query.auth_id) {
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
      res.send(404);
    }
  });

  router.get('/auth', function(req, res) {
    var id = JSON.parse(decodeURIComponent(req.query.state));
    var code = req.query.code;
    oauth2Client.getToken(code, function(err, tokens) {
      if (! err) {
        User.findByIdAndUpdate(id, {google: tokens}, {new: true}, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            oauth2Client.setCredentials({
              access_token: user.google.tokens.access_token,
              refresh_token: user.google.tokens.fresh_token
            });
          }
        });
        res.send(200);
      }
    })
  });

  router.post('/interactive', urlencodedParser, (req, res) => {
    console.log('this is req.body', req.body);
    var parsed = JSON.parse(req.body.payload);
    var response = parsed.actions[0].value;
    res.send(response)
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
  })
  return router;
}



module.exports = allRoutes;

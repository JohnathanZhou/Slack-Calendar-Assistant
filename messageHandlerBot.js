//IF NGROK GETS RESET, PUT NEW FORWARD URL HERE:
//https://api.slack.com/apps/A6G2BGPUK/interactive-messages?saved=1

// RTM installs
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var WebClient = require('@slack/client').WebClient;
var IncomingWebhook = require('@slack/client').IncomingWebhook;

// RTM requires
var token = process.env.SLACK_API_TOKEN || '';
var url = process.env.WEBHOOK_URL || '';
var web = new WebClient(token);
var WebHook = new IncomingWebhook(url)
var rtm = new RtmClient(token, { logLevel: 'debug' });

// Express installs
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
var axios = require('axios');
var models = require('./models/models');
var routes = require('./routes/routes');
var User = models.User;

var urlencodedParser = bodyParser.urlencoded({ extended: false });
mongoose.connect(connect);
var app = express();
// view engine setup
var hbs = require('express-handlebars')({
  defaultLayout: 'main',
  extname: '.hbs'
});
app.engine('hbs', hbs);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(logger('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const postAI = function(message) {
  // curl 'https://api.api.ai/api/query?v=20150910&query=hi&lang=en&sessionId=bad504f3-0f2c-463e-8d34-d9097fe24091&timezone=2017-08-01T10:53:53-0700' -H 'Authorization:Bearer 62a307990113474eade3e4a3a7472e4f'
  return axios.post('https://api.api.ai/v1/query?v=20150910', {
      query: message.text,
      lang: 'en',
      sessionId: message.user,
      timezone: "2017-08-01T10:53:53-0700"
    },
    {
      headers: {Authorization: `Bearer ${process.env.APIAI_TOKEN}`}
    }
  )
}

const confirmMessage = function(channel, message) {
  if (message.includes("set!")) {
    // web.chat.postMessage(channel, message, web.chat.postMessage(channel, message)
    web.chat.postMessage(channel, message+' Confirm that this event is ok? ', { "attachments": [
          {
              "fallback": "Unable to set calendar event",
              "callback_id": "wopr_game",
              "color": "#3AA3E3",
              "attachment_type": "default",
              "actions": [
                {
                    "name": "reminder",
                    "text": "Yes",
                    "type": "button",
                    "value": "scheduleReminder",
                    "confirm": {
                      "title": "Are you sure?",
                      "text": "This will add a calendar reminder to your google account",
                      "ok_text": "Yes",
                      "dismiss_text": "No"
                    }
                },
                {
                    "name": "reminder",
                    "text": "No",
                    "type": "button",
                    "value": "dontScheduleReminder",
                    "confirm": {
                      "title": "Are you sure you want to cancel?",
                      "text": "This reminder will not be saved",
                      "ok_text": "Yes",
                      "dismiss_text": "No"
                    }
                },
            ]
          }
      ]}, function(err, res) {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
    }
    })
  }
  else {
    web.chat.postMessage(channel, message)
  }
}

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  console.log("HEREEEEEEEE: ", message)
  app.use('/', routes(rtm, web, message));

  if (message.bot_id || (message.message && message.message.bot_id)) {
    return;
  }
  else {
    var slackUser = rtm.dataStore.getUserById(message.user);
    //console.log('HERES A BUNCH OF INFO: slackID: ', user.id, 'slackUsername: ', user.name, 'slackEmail: ', user.profile.email);

    User.findOne({slackEmail: slackUser.profile.email}, function(err, user) {
      if (err) {
        console.log(err);
      } else if (user) {
        if (user.google) {
          postAI(message)
          .then((data) =>
            {
            const msg = data.data.result.fulfillment.speech
            confirmMessage(message.channel, msg)
          })
          .catch((err) => (
            console.log('error ', err)))
        } else {
          web.chat.postMessage(message.channel, "You have not authenticated with Google Calendar yet. Please follow this link to authenticate: " + process.env.DOMAIN + "/connect?auth_id=" + user._id);
        }
      } else if (! user) {
        new User({
          slackID: slackUser.id,
          slackUsername: slackUser.name,
          slackEmail: slackUser.profile.email,
        }).save(function(err, user) {
          if (err) {
            console.log(err);
          } else {
            web.chat.postMessage(message.channel, "You have not authenticated with Google Calendar yet. Please follow this link to authenticate: " + process.env.DOMAIN + "/connect?auth_id=" + user._id);
          }
        });
      }
    });
  }
});

rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReactionAdded(reaction) {
  console.log('Reaction added:', reaction);
});

rtm.on(RTM_EVENTS.REACTION_REMOVED, function handleRtmReactionRemoved(reaction) {
  console.log('Reaction removed:', reaction);
});

var port = process.env.PORT || 3000;
app.listen(port);
rtm.start();

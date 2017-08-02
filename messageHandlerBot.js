//IF NGROK GETS RESET, PUT NEW FORWARD URL HERE:
//https://api.slack.com/apps/A6G2BGPUK/interactive-messages?saved=1

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var WebClient = require('@slack/client').WebClient;
var IncomingWebhook = require('@slack/client').IncomingWebhook;
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
var axios = require('axios');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var models = require('./models/models');
var routes = require('./routes/routes');

var User = models.User;

var token = process.env.SLACK_API_TOKEN || '';
var url = process.env.WEBHOOK_URL || '';
var web = new WebClient(token);
var WebHook = new IncomingWebhook(url)

var rtm = new RtmClient(token, { logLevel: 'debug' });

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

app.use('/', routes(rtm, web));

// function sendMessageToSlackResponseURL(responseURL, JSONmessage){
//     var postOptions = {
//         uri: responseURL,
//         method: 'POST',
//         headers: {
//             'Content-type': 'application/json'
//         },
//         json: JSONmessage
//     }
//     request(postOptions, (error, response, body) => {
//         if (error){
//             console.log("CANT SENT RESPONSE YIKES")
//         }
//     })
// }

const postAI = function(message) {
  console.log('inside post request');

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
    console.log('It works!');
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
                    "value": "dontScheduleReminder"
                },
            ]
          }
      ]}, function(err, res) {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
      //USER INFO FOR MODEL:
      // var user = rtm.dataStore.getUserById(message.user);
      // console.log('HERES A BUNCH OF INFO: slackID: ', user.id, 'slackUsername: ', user.name, 'slackEmail: ', user.profile.email);
    }
    })
  }
  else {
    web.chat.postMessage(channel, message)
  }
}


// rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
//   if (message.subtype === 'bot_message') {
//     return;
//   }
//   else {
//     var slackUsername = rtm.dataStore.getUserById(message.user);
//     if (slackUsername) {
//       postAI(message)
//       .then((data) =>
//         {
//           console.log('THIS IS THE TEST FUNCTION IT SHOULD BE BOOLEAN: ',test);
//         const msg = data.data.result.fulfillment.speech
//         console.log('THIS IS YOUR DATA: ', msg)
//         confirmMessage(message.channel, msg)
//       })
//       .catch((err) => (
//         console.log('error ', err)))
//     }
//     else {
//         web.chat.postMessage(message.channel, process.env.WEBHOOK_URL+'/auth')
//     }
//   }
// })

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  console.log('Message:', message);
  if (message.subtype === 'bot_message') {
    return;
  }
  else {
    //USER INFO FOR MODEL:
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
            console.log('THIS IS YOUR DATA: ', msg)
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

// app.post('/interactive', urlencodedParser, (req, res) => {
//   var parsed = JSON.parse(req.body.payload);
//   var response = parsed.actions[0].value;
//   if (response === 'scheduleReminder') {
//     console.log('hey its me im here')
//   }
//   // make calendar event here if response is yes
// })

rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReactionAdded(reaction) {
  console.log('Reaction added:', reaction);
});

rtm.on(RTM_EVENTS.REACTION_REMOVED, function handleRtmReactionRemoved(reaction) {

  console.log('Reaction removed:', reaction);
});

var port = process.env.PORT || 3000;
app.listen(port);
rtm.start();

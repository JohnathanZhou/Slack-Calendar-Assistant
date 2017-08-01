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
var axios = require('axios')
var models = require('./models/models');
var routes = require('./routes/routes');

var token = process.env.SLACK_API_TOKEN || '';
var url = process.env.WEBHOOK_URL || '';
var web = new WebClient(token);
var WebHook = new IncomingWebhook(url)

var rtm = new RtmClient(token, { logLevel: 'debug' });
rtm.start();
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

app.use('/', routes);

// rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
//   console.log('Message:', message);
  // if (message.subtype === 'bot_message') {
  //   return;
  // }
  // else {
//     web.chat.postMessage(message.channel, 'yo', { "attachments": [
//           {
//               "fallback": "You are unable to choose a game",
//               "callback_id": "wopr_game",
//               "color": "#3AA3E3",
//               "attachment_type": "default",
//               "actions": [
//                   {
//                       "name": "game",
//                       "text": "Chess",
//                       "type": "button",
//                       "value": "chess"
//                   },
//                   {
//                       "name": "game",
//                       "text": "Falken's Maze",
//                       "type": "button",
//                       "value": "maze"
//                   },
//                   {
//                       "name": "game",
//                       "text": "Thermonuclear War",
//                       "style": "danger",
//                       "type": "button",
//                       "value": "war",
//                       "confirm": {
//                           "title": "Are you sure?",
//                           "text": "Wouldn't you prefer a good game of chess?",
//                           "ok_text": "Yes",
//                           "dismiss_text": "No"
//                       }
//                   }
//               ]
//           }
//       ]}, function(err, res) {
//     if (err) {
//       console.log('Error:', err);
//     } else {
//       console.log('Message sent: ', res);
//     }
//   });
//   }
// });

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  if (message.subtype === 'bot_message') {
    return;
  }
  else {
      postAI(message)
      .then((data) =>
        {
        const msg = data.data.result.fulfillment.speech
        console.log('THIS IS YOUR DATA: ', msg)
        web.chat.postMessage(message.channel, msg)
      })
      .catch((err) => (
        console.log('error ', err)))
  }
})

var postAI = function(message) {
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

var confirmMessage = function(channel, message) {
  
}


rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReactionAdded(reaction) {
  console.log('Reaction added:', reaction);
});

rtm.on(RTM_EVENTS.REACTION_REMOVED, function handleRtmReactionRemoved(reaction) {
  console.log('Reaction removed:', reaction);
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log('Express started. Listening on port %s', port);

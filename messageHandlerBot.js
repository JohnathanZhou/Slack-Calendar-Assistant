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

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var models = require('./models/models');
var routes = require('./routes/routes');

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

function sendMessageToSlackResponseURL(responseURL, JSONmessage){
    var postOptions = {
        uri: responseURL,
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        json: JSONmessage
    }
    request(postOptions, (error, response, body) => {
        if (error){
            console.log("CANT SENT RESPONSE YIKES")
        }
    })
}

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  console.log('Message:', message);
  if (message.subtype === 'bot_message') {
    return;
  }
  else {
    web.chat.postMessage(message.channel, 'Would you like to schedule a reminder?', { "attachments": [
          {
              "fallback": "You are unable to schedule a reminder",
              "callback_id": "scheduleReminder",
              "color": "#3AA3E3",
              "attachment_type": "default",
              "response_url": process.env.NGROK_URL,
              "actions": [
                  {
                      "name": "reminder",
                      "text": "Yes",
                      "type": "button",
                      "value": "scheduleReminder",
                  },
                  {
                      "name": "reminder",
                      "text": "No",
                      "type": "button",
                      "value": "dontScheduleReminder"
                  },
                  {
                      "name": "game",
                      "text": "options",
                      "style": "danger",
                      "type": "button",
                      "value": "war",
                      "confirm": {
                          "title": "Are you sure?",
                          "text": "Wouldn't you prefer a good game of chess?",
                          "ok_text": "Yes",
                          "dismiss_text": "No"
                      }
                  }
              ]
          }
      ]}, function(err, res) {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);

      //USER INFO FOR MODEL:
      var user = rtm.dataStore.getUserById(message.user);
      console.log('HERES A BUNCH OF INFO: slackID: ', user.id, 'slackUsername: ', user.name, 'slackEmail: ', user.profile.email);
    }
  });
  }
});

// app.post('/interactive', urlencodedParser, (req, res) => {
//   var parsed = JSON.parse(req.body.payload);
//   var response = parsed.actions[0].value;
//   res.send(response)
  //make calendar event here if response is yes
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

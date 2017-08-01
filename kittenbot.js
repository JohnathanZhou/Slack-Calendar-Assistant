//IF NGROK GETS RESET, PUT NEW FORWARD URL HERE:
//https://api.slack.com/apps/A6G2BGPUK/interactive-messages?saved=1

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var WebClient = require('@slack/client').WebClient;

var token = process.env.SLACK_API_TOKEN || '';

var web = new WebClient(token);

var rtm = new RtmClient(token, { logLevel: 'debug' });
rtm.start();

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  console.log('Message:', message);
  // rtm.sendMessage('HEY ITS KAMRAN', message.channel);
  web.chat.postMessage(message.channel, 'HEY YOU', function (err, res) {
    console.log('ok')
  })
//   web.chat.postMessage(message.channel, 'HEY YOU', [
//         {
//             "fallback": "You are unable to choose a game",
//             "callback_id": "wopr_game",
//             "color": "#3AA3E3",
//             "attachment_type": "default",
//             "actions": [
//                 {
//                     "name": "game",
//                     "text": "Chess",
//                     "type": "button",
//                     "value": "chess"
//                 },
//                 {
//                     "name": "game",
//                     "text": "Falken's Maze",
//                     "type": "button",
//                     "value": "maze"
//                 },
//                 {
//                     "name": "game",
//                     "text": "Thermonuclear War",
//                     "style": "danger",
//                     "type": "button",
//                     "value": "war",
//                     "confirm": {
//                         "title": "Are you sure?",
//                         "text": "Wouldn't you prefer a good game of chess?",
//                         "ok_text": "Yes",
//                         "dismiss_text": "No"
//                     }
//                 }
//             ]
//         }
//     ], function(err, res) {
//   if (err) {
//     console.log('Error:', err);
//   } else {
//     console.log('Message sent: ', res);
//   }
// });
});


rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReactionAdded(reaction) {
  console.log('Reaction added:', reaction);
});

rtm.on(RTM_EVENTS.REACTION_REMOVED, function handleRtmReactionRemoved(reaction) {
  console.log('Reaction removed:', reaction);
});

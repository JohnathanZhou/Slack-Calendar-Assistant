/* *****************************************************************************
Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License")
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
********************************************************************************

This is a sample Slack bot built with Botkit.
*/
//
// var Botkit = require('botkit')
//
// var controller = Botkit.slackbot({debug: false})
// controller
//   .spawn({
//     token: 'xoxb-221043661830-R90Ku1gIH8ZX106fWMQ1wOv0' // Edit this line!
//   })
//   .startRTM(function (err) {
//     if (err) {
//       throw new Error(err)
//     }
//   })
//
// controller.hears(
//   ['hello', 'hi'], ['direct_message', 'direct_mention', 'mention'],
//   function (bot, message) { bot.reply(message, 'Meow. :smile_cat:') })

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var token = process.env.SLACK_API_TOKEN || '';
// var token = 'xoxb-221043661830-xwLcsxcgSVHVM4fC96V5Veyb';

var rtm = new RtmClient(token, { logLevel: 'debug' });
rtm.start();

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  console.log('Message:', message);
});

rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReactionAdded(reaction) {
  console.log('Reaction added:', reaction);
});

rtm.on(RTM_EVENTS.REACTION_REMOVED, function handleRtmReactionRemoved(reaction) {
  console.log('Reaction removed:', reaction);
});

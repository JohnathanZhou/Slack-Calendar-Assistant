var google = require('googleapis');
var calendar = google.calendar('v3');
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
mongoose.connect(connect);
var models = require('./models/models');
var Meeting = models.Meeting;


function checkConflict(message, user) {
  var split = message.split('=');
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
  var userPromises = inviteesID.map(function(id) {
    return User.findOne({slackID: id}).exec();
  })
  Promise.all(userPromises)
    .then(function(userObjects) {
      var googleTokens = userObjects.map((user) => {
        return user.google
      })
      googleTokens.push(user.google)
      return googleTokens
    })
    .then((authTokens) => {
      authTokens.map((token) => {


      })
    })
}

function checkBusy(token) {
  axios.post('https://wwww.googleapis.com/calendar/v3/freeBusy',
  {
    "timeMin": datetime,
    "timeMax": datetime,
    "items": [
      {
        "id": string
      }
    ]
  })
  .then((data) => {
    
  })
}






module.exports = checkConflict;

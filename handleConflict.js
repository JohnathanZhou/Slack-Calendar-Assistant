var google = require('googleapis');
var calendar = google.calendar('v3');
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
mongoose.connect(connect);
var models = require('./models/models');
var Meeting = models.Meeting;


function checkConflict(messageObj, user) {
  Promise.all(messageObj.userPromises)
    .then(function(userObjects) {
      var googleTokens = userObjects.map((user) => {
        return user.google
      })
      googleTokens.push(user.google)
      return googleTokens
    })
    .then((authTokens) => {
      authTokens.map((token) => {
        checkBusy(token)
      })
    })
}

function checkBusy(token) {
  axios.post('https://wwww.googleapis.com/calendar/v3/freeBusy',
  {
    "timeMin": date + "T" + time,
    "timeMax": date + "T" + endHour + ":" + endTimeMin + ":00",
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

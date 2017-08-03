var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var calendar = google.calendar('v3');
var mongoose = require('mongoose');
var connect = process.env.MONGODB_URI;
mongoose.Promise = global.Promise;
mongoose.connect(connect);
var models = require('./models/models');
var User = models.User;



function checkConflict(messageObj, user) {
  return new Promise(function(resolve, reject) {
    var listOfBusyTime;
    var userPromises = messageObj.inviteesID.map(function(id) {
      return User.findOne({slackID: id}).exec();
    })
    Promise.all(userPromises)
      .then(function(userObjects) {
        var userobjects = userObjects;
        userObjects.push(user);
        return userObjects;
      })
      .then((userObjects) => {
        var listOfBusyTime = userObjects.map((object) => {
          return checkBusy(messageObj.date, messageObj.time, object);
        });
        return Promise.all(listOfBusyTime);
      })
      .then(function(lists) {
        resolve(lists);
      })
      .catch((err) => {
        console.log("handleConflict promise err: ", err);
        reject(err);
      })
  })
}

function checkBusy(date, time, object) {
  return new Promise(function(resolve, reject) {
    var thisDate = new Date(date);
    var nextWeek = new Date();
    nextWeek.setDate(thisDate.getDate() + 7);
    var oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.DOMAIN + "/auth"
    );

    oauth2Client.setCredentials({
      access_token: object.google.access_token,
      refresh_token: object.google.refresh_token
    })

    var rightNow = new Date();
    if (object.google.expiry_date - rightNow.getTime() <= 0 ) {
      oauth2Client.refreshAccessToken(function(err, tokens) {
        if (err) {
          reject(err);
          return;
        }
        oauth2Client.setCredentials({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token
        });
        User.findByIdAndUpdate(object._id, {google: tokens});
        console.log("this is user object", object);
        console.log("oauth2Client", oauth2Client);
        calendar.events.list({
          auth: oauth2Client,
          calendarId: 'primary',
          timeMin: thisDate
        }, function(err, list) {
          if (err) {
            console.log("err connecting to calendar", err);
            reject(err);
            return;
          } else {
            var eventTimeList = list.items.map((event) => {
              console.log("this is time", event.start.dateTime, event.end.dateTime);
              return [event.start.dateTime, event.end.dateTime];
            })
            resolve(eventTimeList);
          }
        });
      });
    }
  })
}

module.exports = checkConflict;

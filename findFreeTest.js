
// eventTimes is an array of objects with start/end tenFreeTimes
//messageObj is an object with date, time, etc
function findFreeTimes(eventTimes, messageObj) {
  var convTime = new Date(messageObj.date + "T" + messageObj.time)
  var currentEventStart = convTime.getTime()
  var currentEventEnd = currentEventStart + 1800000
  var currentEventObj = {'start': currentEventStart, 'end': currentEventEnd}
  eventTimes.map((eventTimeObj) => {
    var eventTimeObject = convertMilli(eventTimeObj)
    if (checkConflict(eventTimeObject, currentEventObj)) {
      console.log('this should happen like 10 times');
      return findTenFree(eventTimes, currentEventObj)
    }
    else {
      console.log('no conflict at this event', eventTimeObj);
    }
  })
  console.log('no conflict at all');
  return false
}
//convert to milliseconds, takes in object with start/end
function convertMilli(eventTimeObj) {
  var eventStartTime = new Date(eventTimeObj.start)
  eventStartTime = eventStartTime.getTime()
  var eventEndTime = new Date(eventTimeObj.end)
  eventEndTime = eventEndTime.getTime()
  return {'start': eventStartTime, 'end': eventEndTime}
}
//checks conflict between two time objects
function checkConflict(eventTimeObj, currentEventObj) {
    var currentEventStart = currentEventObj.start
    var currentEventEnd = currentEventObj.end
    var eventStartTime = eventTimeObj.start
    var eventEndTime = eventTimeObj.end
    console.log('new event starting date: ',new Date(currentEventStart), eventTimeObj)
    console.log('new event ending date: ', new Date(currentEventEnd))
    console.log('checking events start date: ', new Date(eventStartTime), currentEventObj)
    console.log('checking events end date: ', new Date(eventEndTime));
    if (currentEventStart > eventStartTime) {
      if (currentEventStart > eventEndTime) {
        //schedule event normally
        return false
      }
      else {
        //find 10 free times
        return true
      }
    }
    else if (currentEventStart < eventStartTime) {
      if (currentEventEnd < eventStartTime) {
        return false
      }
      else {
        return true
      }
    }
}

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

//A loop with a return value, takes in eventTimes (array of objects) and a currentEventObj
function findTenFree(eventTimes, currentEventObj) {
  var tenFreeTimes = []
  var eventCounter = 0
  var dayCounter = 0
  var aDay = 86400000;
  var now = new Date().getTime();
  var time = now - now%aDay + aDay;
  var halfHour = aDay/48;
  var startTime = currentEventObj.end + halfHour
  while (eventCounter < 10) {
      // eventTimes.map((eventObj) => {
      // var eventTimeObject = convertMilli(eventObj)
      if (containsObject({'start': startTime, 'end': startTime + halfHour}, eventTimes)) {
        startTime = startTime + halfHour
      }
      else {
        
      }

      if(!checkConflict(eventTimeObject, {'start': startTime, 'end': startTime + halfHour})) {
        console.log('THIS IS THE event counter: ', eventCounter);
        if (tenFreeTimes.indexOf(startTime) > -1) {

        }
        else {
          tenFreeTimes.push(startTime)
          console.log('This is the array of shit', tenFreeTimes);
          eventCounter ++
          dayCounter++
          if (dayCounter === 2) {
            dayCounter = 0
            startTime = startTime - startTime%aDay + aDay + aDay/3
          }
        }
          // else {
          //   startTime = startTime + 1800000
          // }
        }
      // })
      startTime = startTime + halfHour
    }
  return tenFreeTimes
}

module.exports = findFreeTimes;

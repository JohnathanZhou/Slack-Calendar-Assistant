
// eventTimes is an array of objects with start/end tenFreeTimes
//messageObj is an object with date, time, etc
function findFreeTimes(eventTimes, messageObj) {
  var convTime = new Date(messageObj.date + 'T' + messageObj.time)
  var currentEventStart = convTime.getTime()
  var currentEventEnd = currentEventStart + 1800000
  var currentEventObj = {'start': currentEventStart, 'end': currentEventEnd}
  console.log('this is current time object: ', currentEventObj);
  for (var i = 0; i<eventTimes.length; i++) {
    var eventTimeObject = convertMilli(eventTimes[i])
    if (checkConflict(eventTimeObject, currentEventObj)) {
      console.log('single conflict found');
      return findTenFree(eventTimes, currentEventObj)
    }
    else {
      console.log('no conflict at this event', eventTimeObj);
    }
  }
  console.log('This means that there are no time conflicts currently');
  return false
}
//convert to milliseconds, takes in object with start/end
function convertMilli(eventTimeObj) {
  console.log('before: ', eventTimeObj);
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
    if (currentEventStart > eventStartTime && currentEventStart > eventEndTime) {
        //schedule event normally
        return false
      }
      else {
        //find 10 free times
        return true
      }
    if (currentEventStart < eventStartTime && currentEventEnd < eventStartTime) {
        return false
      }
      else {
        return true
      }
    }

function arrContainsValue(arr, value) {
  arr.forEach(function(item) {
    if (item === value) {
      return true
    }
  })
  return false
}

//A loop with a return value, takes in eventTimes (array of objects) and a currentEventObj
function findTenFree(eventTimes, currentEventObj) {
  var tenFreeTimes = []
  var eventCounter = 0
  var dayCounter = 0
  var aDay = 86400000;
  // var now = new Date().getTime();
  // var time = now - now%aDay + aDay;
  var halfHour = aDay/48;
  var startTime = currentEventObj.end + halfHour
  while (eventCounter < 10) {
      for (var i = 0; i < eventTimes.length; i++) {
        var fixedObj = convertMilli(eventTimes[i])
        // console.log(fixedObj, 'this next obj should be changing:', {'start': startTime, 'end': startTime + halfHour});
        if(!checkConflict(fixedObj, {'start': startTime, 'end': startTime + halfHour})) {
          // console.log('THIS IS THE event counter: ', eventCounter);
          tenFreeTimes.push(startTime)
          // console.log('This is the array of shit', tenFreeTimes);
          eventCounter ++
          dayCounter++
          if (dayCounter === 3) {
            dayCounter = 0
          }
          break;
        }
      }
      if (dayCounter === 0) {
        startTime = startTime - startTime%aDay + aDay + aDay/3
      }
      else {
        startTime = startTime + halfHour
      }
    }
  return tenFreeTimes
}

module.exports = findFreeTimes;

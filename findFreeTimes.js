
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
      findTenFree(eventTimes, curentEventObj)
    }
    else {
      return false
    }
  })
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
    if (currentEventStart < eventStartTime) {
      if (currentEventEnd < eventStartTime) {
        return false
      }
      else {
        return true
      }
    }
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
  var startTime = currentEventObj.end + 1800000
  while (eventCounter < 10) {
    while (dayCounter < 3) {
      eventTimes.map((eventObj) => {
        var eventTimeObject = convertMilli(eventObj)
        if(!checkConflict(eventTimeObject, {'start': startTime, 'end': startTime + halfHour})) {
          tenFreeTimes.push(startTime)
          eventCounter ++
          if (dayCounter === 2) {
            dayCounter = 0
            startTime = startTime - startTime%aDay + aDay + aDay/3
          }
          if (eventCounter === 10) {
            return tenFreeTimes
          }
          else {
            dayCounter++
          }
        }
      })
    }
  }
}

module.exports = findFreeTimes;

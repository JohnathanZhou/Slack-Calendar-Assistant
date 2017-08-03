

function findFreeTimes(eventTimes, messageObj) {
  var convTime = new Date(messageObj.date + "T" + messageObj.time)
  var currentEventStart = convTime.getTime()
  var currentEventEnd = currentEventStart + 1800000
  var currentEventObj = {'start': currentEventStart, 'end': currentEventEnd}
  eventTimes.map((eventTimeObj) => {
    var eventStartTime = new Date(eventTimeObj.start)
    eventStartTime = eventStartTime.getTime()
    var eventEndTime = new Date(eventTimeObj.end)
    eventStartTime = eventStartTime.getTime()
    if (!checkIndividualTime(eventTimeObj, currentEventObj)) {
      findTenFree(eventTimes, currentEventEnd)
    }
    else {
      return false
    }
  })
}

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

function findTenFree(eventTimes, currentEventEnd) {
  var tenFreeTimes = []
  var eventCounter = 0
  var dayCounter = 0
  var aDay = 86400000;
  var now = new Date().getTime();
  var time = now - now%aDay + aDay;
  var halfHour = aDay/48;
  var startTime = currentEventEnd + 1800000
  while (eventCounter < 10) {
    while(dayCounter < 3) {

      if(checkIndividualTime) {
        eventCounter ++
        if (dayCounter === 2) {
          dayCounter = 0
        }
      }
    }


  }

}

module.exports = findFreeTimes;

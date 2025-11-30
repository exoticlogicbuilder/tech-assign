function isValidEvent(event) {
  if (!event || typeof event !== 'object') {
    return false;
  }

  if (!event.service || typeof event.service !== 'string') {
    return false;
  }

  if (!event.timestamp || typeof event.timestamp !== 'string') {
    return false;
  }

  const date = new Date(event.timestamp);
  if (isNaN(date.getTime())) {
    return false;
  }

  return true;
}

function sortEventsByService(events) {
  const serviceMap = {};

  for (const event of events) {
    if (!isValidEvent(event)) {
      continue;
    }

    const service = event.service;
    if (!serviceMap[service]) {
      serviceMap[service] = [];
    }

    serviceMap[service].push({
      service,
      timestamp: event.timestamp,
      date: new Date(event.timestamp)
    });
  }

  for (const service in serviceMap) {
    serviceMap[service].sort((a, b) => a.date - b.date);
  }

  return serviceMap;
}

function detectMissedHeartbeats(events, expectedIntervalSeconds, allowedMisses) {
  const serviceMap = sortEventsByService(events);
  const alerts = [];

  for (const service in serviceMap) {
    const serviceEvents = serviceMap[service];
    
    if (serviceEvents.length === 0) {
      continue;
    }

    let consecutiveMisses = 0;
    let expectedTime = null;

    for (let i = 0; i < serviceEvents.length; i++) {
      const currentEvent = serviceEvents[i];
      const currentTime = currentEvent.date.getTime();

      if (expectedTime === null) {
        expectedTime = currentTime + expectedIntervalSeconds * 1000;
        continue;
      }

      while (expectedTime <= currentTime) {
        if (expectedTime < currentTime) {
          consecutiveMisses++;

          if (consecutiveMisses >= allowedMisses) {
            alerts.push({
              service: service,
              alert_at: currentEvent.timestamp
            });
            consecutiveMisses = 0;
            expectedTime = currentTime + expectedIntervalSeconds * 1000;
            break;
          }

          expectedTime += expectedIntervalSeconds * 1000;
        } else {
          consecutiveMisses = 0;
          expectedTime = currentTime + expectedIntervalSeconds * 1000;
          break;
        }
      }
    }
  }

  return alerts;
}

module.exports = {
  isValidEvent,
  sortEventsByService,
  detectMissedHeartbeats
};

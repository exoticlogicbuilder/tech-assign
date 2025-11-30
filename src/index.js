const fs = require('fs');
const path = require('path');
const { detectMissedHeartbeats } = require('./heartbeat-monitor');

const eventsFilePath = process.argv[2] || path.resolve(__dirname, '../data/events.json');
const expectedIntervalSeconds = parseInt(process.argv[3] || '60', 10);
const allowedMisses = parseInt(process.argv[4] || '3', 10);

function loadEvents(filePath) {
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading events file:', error.message);
    process.exit(1);
  }
}

const events = loadEvents(eventsFilePath);
const alerts = detectMissedHeartbeats(events, expectedIntervalSeconds, allowedMisses);

console.log(JSON.stringify(alerts, null, 2));

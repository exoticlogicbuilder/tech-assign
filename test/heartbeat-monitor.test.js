const { isValidEvent, sortEventsByService, detectMissedHeartbeats } = require('../src/heartbeat-monitor');

function assertEqual(actual, expected, testName) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  
  if (actualStr === expectedStr) {
    console.log(`✓ ${testName}`);
  } else {
    console.error(`✗ ${testName}`);
    console.error(`  Expected: ${expectedStr}`);
    console.error(`  Actual:   ${actualStr}`);
    process.exit(1);
  }
}

console.log('Running tests...\n');

console.log('Test: isValidEvent');
assertEqual(isValidEvent({ service: 'email', timestamp: '2025-08-04T10:00:00Z' }), true, 'Valid event');
assertEqual(isValidEvent({ service: 'email' }), false, 'Missing timestamp');
assertEqual(isValidEvent({ timestamp: '2025-08-04T10:00:00Z' }), false, 'Missing service');
assertEqual(isValidEvent({ service: 'email', timestamp: 'not-a-timestamp' }), false, 'Invalid timestamp');
assertEqual(isValidEvent(null), false, 'Null event');
assertEqual(isValidEvent(undefined), false, 'Undefined event');

console.log('\nTest: Working alert case (3 consecutive misses)');
const workingAlertEvents = [
  { service: 'email', timestamp: '2025-08-04T10:00:00Z' },
  { service: 'email', timestamp: '2025-08-04T10:01:00Z' },
  { service: 'email', timestamp: '2025-08-04T10:02:00Z' },
  { service: 'email', timestamp: '2025-08-04T10:06:00Z' }
];
const workingAlertResult = detectMissedHeartbeats(workingAlertEvents, 60, 3);
assertEqual(workingAlertResult, [{ service: 'email', alert_at: '2025-08-04T10:06:00Z' }], 'Alert triggered at 10:06');

console.log('\nTest: Near-miss case (only 2 missed → no alert)');
const nearMissEvents = [
  { service: 'sms', timestamp: '2025-08-04T10:00:00Z' },
  { service: 'sms', timestamp: '2025-08-04T10:01:00Z' },
  { service: 'sms', timestamp: '2025-08-04T10:04:00Z' }
];
const nearMissResult = detectMissedHeartbeats(nearMissEvents, 60, 3);
assertEqual(nearMissResult, [], 'No alert for only 2 misses');

console.log('\nTest: Unordered input');
const unorderedEvents = [
  { service: 'push', timestamp: '2025-08-04T10:06:00Z' },
  { service: 'push', timestamp: '2025-08-04T10:00:00Z' },
  { service: 'push', timestamp: '2025-08-04T10:02:00Z' },
  { service: 'push', timestamp: '2025-08-04T10:01:00Z' }
];
const unorderedResult = detectMissedHeartbeats(unorderedEvents, 60, 3);
assertEqual(unorderedResult, [{ service: 'push', alert_at: '2025-08-04T10:06:00Z' }], 'Handles unordered events correctly');

console.log('\nTest: Malformed events');
const malformedEvents = [
  { service: 'api', timestamp: '2025-08-04T10:00:00Z' },
  { service: 'api' },
  { timestamp: '2025-08-04T10:02:00Z' },
  { service: 'api', timestamp: 'invalid-timestamp' },
  { service: 'api', timestamp: '2025-08-04T10:01:00Z' },
  { service: 'api', timestamp: '2025-08-04T10:05:00Z' }
];
const malformedResult = detectMissedHeartbeats(malformedEvents, 60, 3);
assertEqual(malformedResult, [{ service: 'api', alert_at: '2025-08-04T10:05:00Z' }], 'Skips malformed events and processes valid ones');

console.log('\nTest: No misses');
const noMissesEvents = [
  { service: 'webhook', timestamp: '2025-08-04T10:00:00Z' },
  { service: 'webhook', timestamp: '2025-08-04T10:01:00Z' },
  { service: 'webhook', timestamp: '2025-08-04T10:02:00Z' },
  { service: 'webhook', timestamp: '2025-08-04T10:03:00Z' }
];
const noMissesResult = detectMissedHeartbeats(noMissesEvents, 60, 3);
assertEqual(noMissesResult, [], 'No alert when all heartbeats are present');

console.log('\nTest: Multiple services with different patterns');
const multiServiceEvents = [
  { service: 'email', timestamp: '2025-08-04T10:00:00Z' },
  { service: 'email', timestamp: '2025-08-04T10:01:00Z' },
  { service: 'email', timestamp: '2025-08-04T10:02:00Z' },
  { service: 'email', timestamp: '2025-08-04T10:06:00Z' },
  { service: 'sms', timestamp: '2025-08-04T10:00:00Z' },
  { service: 'sms', timestamp: '2025-08-04T10:01:00Z' },
  { service: 'sms', timestamp: '2025-08-04T10:04:00Z' }
];
const multiServiceResult = detectMissedHeartbeats(multiServiceEvents, 60, 3);
assertEqual(multiServiceResult, [{ service: 'email', alert_at: '2025-08-04T10:06:00Z' }], 'Only email triggers alert, not sms');

console.log('\nTest: Custom allowed misses');
const customMissesEvents = [
  { service: 'db', timestamp: '2025-08-04T10:00:00Z' },
  { service: 'db', timestamp: '2025-08-04T10:03:00Z' }
];
const customMissesResult = detectMissedHeartbeats(customMissesEvents, 60, 2);
assertEqual(customMissesResult, [{ service: 'db', alert_at: '2025-08-04T10:03:00Z' }], 'Alert with custom allowed_misses=2');

console.log('\nTest: Recovery after alert');
const recoveryEvents = [
  { service: 'cache', timestamp: '2025-08-04T10:00:00Z' },
  { service: 'cache', timestamp: '2025-08-04T10:01:00Z' },
  { service: 'cache', timestamp: '2025-08-04T10:05:00Z' },
  { service: 'cache', timestamp: '2025-08-04T10:06:00Z' },
  { service: 'cache', timestamp: '2025-08-04T10:07:00Z' },
  { service: 'cache', timestamp: '2025-08-04T10:11:00Z' }
];
const recoveryResult = detectMissedHeartbeats(recoveryEvents, 60, 3);
assertEqual(recoveryResult, [
  { service: 'cache', alert_at: '2025-08-04T10:05:00Z' },
  { service: 'cache', alert_at: '2025-08-04T10:11:00Z' }
], 'Detects multiple alerts for same service');

console.log('\n✓ All tests passed!\n');

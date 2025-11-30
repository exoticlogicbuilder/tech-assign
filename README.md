# Heartbeat Monitor

A Node.js utility to monitor service heartbeat events and detect missed heartbeats.

## Overview

This program reads heartbeat events from a JSON file, sorts them by service chronologically, and triggers alerts when a service misses a specified number of consecutive expected heartbeats.

## Features

- Gracefully handles malformed events (missing fields, invalid timestamps)
- Supports unordered input data
- Configurable interval and allowed misses
- Clean, readable code with comprehensive test coverage

## Usage

### Run with default settings

```bash
npm start
```

This will use:
- Events file: `data/events.json`
- Expected interval: 60 seconds
- Allowed misses: 3

### Run with custom parameters

```bash
node src/index.js <events-file-path> <expected-interval-seconds> <allowed-misses>
```

Example:

```bash
node src/index.js data/events.json 60 3
```

### Run tests

```bash
npm test
```

## Input Format

The input JSON file should contain an array of heartbeat events:

```json
[
  {
    "service": "email",
    "timestamp": "2025-08-04T10:00:00Z"
  },
  {
    "service": "sms",
    "timestamp": "2025-08-04T10:00:00Z"
  }
]
```

## Output Format

The program outputs an array of alerts:

```json
[
  {
    "service": "email",
    "alert_at": "2025-08-04T10:06:00Z"
  }
]
```

## Algorithm

1. **Validation**: Skip malformed events (missing service/timestamp fields or invalid timestamps)
2. **Sorting**: Group events by service and sort chronologically
3. **Detection**: For each service:
   - Track the expected next heartbeat time based on the interval
   - Count consecutive missed heartbeats
   - Trigger an alert when the count reaches the allowed threshold
   - Reset the counter after triggering an alert or receiving a heartbeat

## Test Cases

The test suite includes:

- ✓ Valid/invalid event validation
- ✓ Working alert case (3 consecutive misses)
- ✓ Near-miss case (only 2 missed → no alert)
- ✓ Unordered input handling
- ✓ Malformed event handling
- ✓ No misses scenario
- ✓ Multiple services with different patterns
- ✓ Custom allowed misses
- ✓ Recovery after alert (multiple alerts for same service)

## Edge Cases Handled

- Missing `service` or `timestamp` fields
- Invalid timestamp formats
- Unordered events
- Empty event arrays
- Multiple services in the same input
- Multiple alerts for the same service
- Recovery after missed heartbeats

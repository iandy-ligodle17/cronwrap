# Splunk Notifier

Send cron job failure alerts to [Splunk](https://www.splunk.com/) via the [HTTP Event Collector (HEC)](https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector).

## Setup

1. Enable HTTP Event Collector in your Splunk instance.
2. Create a new HEC token with access to the desired index.
3. Note the token and your Splunk hostname.

## Usage

```js
const { splunkNotifier } = require('cronwrap/src/notifiers/splunk');

const notify = splunkNotifier({
  token: 'your-hec-token',
  host: 'splunk.example.com',
  port: '8088',          // optional, default: '8088'
  index: 'main',         // optional
  source: 'my-cron',     // optional
  sourcetype: 'cronwrap' // optional, default: 'cronwrap'
});

// use with cronwrap
cronwrap({
  name: 'my-job',
  run: async () => { /* ... */ },
  onError: async (err) => {
    await notify(`Job failed: ${err.message}`);
  },
});
```

## Options

| Option | Required | Default | Description |
|------------|----------|------------|-------------------------------------|
| token | Yes | — | Splunk HEC token |
| host | Yes | — | Splunk hostname |
| port | No | `'8088'` | Splunk HEC port |
| index | No | — | Splunk index |
| source | No | `'cronwrap'` | Event source |
| sourcetype | No | `'cronwrap'` | Event sourcetype |

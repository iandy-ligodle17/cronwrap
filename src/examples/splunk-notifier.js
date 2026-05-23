'use strict';

/**
 * Example: using cronwrap with the Splunk HEC notifier
 *
 * Prerequisites:
 *   - A running Splunk instance with HTTP Event Collector enabled
 *   - An HEC token with write access to the desired index
 *
 * Set environment variables:
 *   SPLUNK_TOKEN  - your HEC token
 *   SPLUNK_HOST   - your Splunk hostname (e.g. splunk.example.com)
 */

const cronwrap = require('../index');
const { splunkNotifier } = require('../notifiers/splunk');

const notify = splunkNotifier({
  token: process.env.SPLUNK_TOKEN,
  host: process.env.SPLUNK_HOST,
  port: '8088',
  index: 'main',
  source: 'my-cron-job',
  sourcetype: 'cronwrap',
});

cronwrap({
  name: 'my-splunk-cron-job',
  run: async () => {
    // your cron job logic here
    console.log('Running cron job...');
  },
  onError: async (err) => {
    await notify(`Cron job failed: ${err.message}`);
  },
});

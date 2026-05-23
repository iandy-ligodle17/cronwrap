'use strict';

/**
 * Example: Using cronwrap with the VictorOps (Splunk On-Call) notifier
 *
 * When your cron job fails, an alert is sent to your VictorOps REST endpoint.
 * Find your REST endpoint URL in VictorOps under:
 *   Integrations > REST Endpoint
 */

const cronwrap = require('../index');
const { victoropsNotifier } = require('../notifiers/victorops');

cronwrap({
  name: 'nightly-backup',
  run: async () => {
    // Simulate your cron job work here
    console.log('Running nightly backup...');
    // throw new Error('Backup failed!'); // Uncomment to test failure alerting
  },
  onFailure: (err) =>
    victoropsNotifier({
      restEndpointUrl: process.env.VICTOROPS_REST_ENDPOINT_URL,
      messageType: 'CRITICAL',
      entityDisplayName: 'nightly-backup cron job failed',
      stateMessage: err.message,
    }),
  onSuccess: () => {
    console.log('Backup completed successfully.');
  },
});

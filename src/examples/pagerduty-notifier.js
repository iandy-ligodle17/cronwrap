/**
 * Example: using cronwrap with the PagerDuty notifier
 *
 * When a cron job fails, this will trigger a PagerDuty incident
 * using the Events API v2.
 *
 * Setup:
 *   1. Create a service in PagerDuty with an Events API v2 integration
 *   2. Copy the integration key
 *   3. Set PAGERDUTY_INTEGRATION_KEY in your environment
 */

const cronwrap = require('../index');
const { pagerdutyNotifier } = require('../notifiers/pagerduty');

const notifier = pagerdutyNotifier({
  integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
  severity: 'critical',
  source: 'my-app-crons',
});

// Example: a job that might fail
cronwrap({
  name: 'nightly-report',
  notifiers: [notifier],
  job: async () => {
    console.log('Running nightly report...');

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Uncomment to simulate a failure and trigger PagerDuty alert:
    // throw new Error('Report generation failed: database unreachable');

    console.log('Nightly report complete.');
  },
});

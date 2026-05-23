/**
 * Example: Using cronwrap with the New Relic notifier
 *
 * This example shows how to send failure alerts to New Relic
 * when a cron job fails or times out.
 *
 * Prerequisites:
 *   - A New Relic account with an API key
 *   - An alert policy created in New Relic Alerts
 */

const cronwrap = require('../index');
const { newrelicNotifier } = require('../notifiers/newrelic');

cronwrap({
  name: 'database-backup',
  timeout: '5m',
  notifiers: [
    newrelicNotifier({
      // Your New Relic REST API key
      // Found at: https://one.newrelic.com/admin-portal/api-keys
      apiKey: process.env.NEW_RELIC_API_KEY,

      // The ID of the alert policy to associate incidents with
      // Found in New Relic Alerts > Policies
      policyId: process.env.NEW_RELIC_POLICY_ID,

      // Optional: override the default alert title
      message: 'Database backup cron job failed!',
    }),
  ],
  run: async () => {
    console.log('Running database backup...');
    // Simulate backup work
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('Backup complete.');
  },
});

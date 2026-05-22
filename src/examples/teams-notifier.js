/**
 * Example: cronwrap with Microsoft Teams notifier
 *
 * Sends a Teams message when a cron job fails or succeeds.
 *
 * Setup:
 *   1. In Teams, go to a channel > Connectors > Incoming Webhook
 *   2. Copy the webhook URL and set it as TEAMS_WEBHOOK_URL env var
 */

const cronwrap = require('../index');
const { teamsNotifier } = require('../notifiers/teams');

const notify = teamsNotifier({
  webhookUrl: process.env.TEAMS_WEBHOOK_URL,
});

cronwrap({
  name: 'daily-report',
  notifiers: [notify],
  job: async () => {
    console.log('Running daily report...');

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Uncomment to simulate a failure:
    // throw new Error('Report generation failed');

    console.log('Daily report complete.');
  },
});

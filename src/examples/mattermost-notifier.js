/**
 * Example: Using the Mattermost notifier with cronwrap
 *
 * Prerequisites:
 *   1. Create an incoming webhook in Mattermost:
 *      Main Menu -> Integrations -> Incoming Webhooks -> Add Incoming Webhook
 *   2. Copy the webhook URL and set it as MATTERMOST_WEBHOOK_URL env var
 */

const cronwrap = require('../index');
const { mattermostNotifier } = require('../notifiers/mattermost');

const notify = mattermostNotifier({
  webhookUrl: process.env.MATTERMOST_WEBHOOK_URL,
  channel: 'ops-alerts',       // optional: override default channel
  username: 'CronBot',         // optional: override display name
  iconEmoji: ':robot_face:',   // optional: override icon
});

cronwrap({
  name: 'nightly-report',
  notifiers: [notify],
  job: async () => {
    console.log('Running nightly report...');
    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('Nightly report complete.');
  },
});

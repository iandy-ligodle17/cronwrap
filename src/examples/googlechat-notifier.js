/**
 * Example: Using cronwrap with the Google Chat notifier
 *
 * Set the GOOGLE_CHAT_WEBHOOK_URL environment variable to your
 * Google Chat incoming webhook URL before running this example.
 *
 * Usage:
 *   GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/... node src/examples/googlechat-notifier.js
 */

const cronwrap = require('../index');
const { googlechatNotifier } = require('../notifiers/googlechat');

const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;

if (!webhookUrl) {
  console.error('Please set the GOOGLE_CHAT_WEBHOOK_URL environment variable.');
  process.exit(1);
}

cronwrap({
  name: 'my-cron-job',
  run: async () => {
    // Simulate some work
    console.log('Running cron job...');
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('Cron job complete.');
  },
  onError: (err) =>
    googlechatNotifier({
      webhookUrl,
      message: `🚨 Cron job *my-cron-job* failed:\n\`\`\`${err.message}\`\`\``,
    }),
});

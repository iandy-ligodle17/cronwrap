/**
 * Example: cronwrap with Slack failure notifications
 *
 * Set the SLACK_WEBHOOK_URL environment variable before running:
 *   SLACK_WEBHOOK_URL=https://hooks.slack.com/... node src/examples/slack-notifier.js
 */

const cronwrap = require('../index');
const { notifySlack } = require('../notifiers/slack');

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

if (!SLACK_WEBHOOK_URL) {
  console.error('Please set the SLACK_WEBHOOK_URL environment variable');
  process.exit(1);
}

// Example: a job that succeeds
cronwrap('fetch-reports', async () => {
  console.log('Fetching reports...');
  await new Promise((resolve) => setTimeout(resolve, 200));
  console.log('Reports fetched successfully.');
}, {
  onFailure: async (jobName, error, durationMs) => {
    console.error(`Job "${jobName}" failed after ${durationMs}ms — notifying Slack`);
    await notifySlack(SLACK_WEBHOOK_URL, jobName, error, durationMs);
  },
});

// Example: a job that fails and triggers a Slack alert
cronwrap('process-payments', async () => {
  console.log('Processing payments...');
  await new Promise((resolve) => setTimeout(resolve, 100));
  throw new Error('Payment gateway timeout');
}, {
  onFailure: async (jobName, error, durationMs) => {
    console.error(`Job "${jobName}" failed after ${durationMs}ms — notifying Slack`);
    await notifySlack(SLACK_WEBHOOK_URL, jobName, error, durationMs);
  },
});

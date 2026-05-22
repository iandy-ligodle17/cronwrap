/**
 * Example: using webhookNotifier with cronwrap
 *
 * This shows how to send failure alerts to a generic webhook endpoint
 * (e.g. a custom API, Discord, Teams, or any HTTP endpoint).
 */

const cronwrap = require('../index');
const { webhookNotifier } = require('../notifiers/webhook');

// Basic usage — POST to a custom endpoint on failure
cronwrap({
  name: 'nightly-report',
  run: async () => {
    console.log('Running nightly report...');
    // your job logic here
  },
  onFailure: webhookNotifier('https://hooks.example.com/alerts'),
});

// With custom headers (e.g. API key auth)
cronwrap({
  name: 'data-sync',
  run: async () => {
    console.log('Syncing data...');
  },
  onFailure: webhookNotifier('https://api.example.com/notify', {
    headers: {
      Authorization: 'Bearer my-secret-token',
      'X-Source': 'cronwrap',
    },
  }),
});

// With a custom payload format (e.g. for Discord webhooks)
cronwrap({
  name: 'cleanup-job',
  run: async () => {
    console.log('Running cleanup...');
  },
  onFailure: webhookNotifier('https://discord.com/api/webhooks/xxx/yyy', {
    formatPayload: (message, meta) => ({
      content: `🚨 **Cron Job Failed**\n${message}`,
      username: 'CronWrap Bot',
    }),
  }),
});

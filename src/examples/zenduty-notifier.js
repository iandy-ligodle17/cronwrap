/**
 * Example: using cronwrap with the Zenduty notifier
 *
 * Zenduty is an incident management platform.
 * Get your API key, service ID, and integrations key from:
 * https://www.zenduty.com/
 */
const cronwrap = require('../index');
const { zendutyNotifier } = require('../notifiers/zenduty');

const notify = zendutyNotifier({
  apiKey: process.env.ZENDUTY_API_KEY,
  serviceId: process.env.ZENDUTY_SERVICE_ID,
  integrationsKey: process.env.ZENDUTY_INTEGRATIONS_KEY,
  alertType: 'critical', // 'critical' | 'warning' | 'info'
});

cronwrap({
  name: 'daily-report',
  notifiers: [notify],
  job: async () => {
    console.log('Running daily report...');
    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('Daily report complete.');
  },
});

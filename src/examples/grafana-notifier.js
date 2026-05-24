/**
 * Example: cronwrap with Grafana annotations notifier
 *
 * This example shows how to use the Grafana notifier to create
 * annotations on your Grafana dashboards whenever a cron job
 * succeeds or fails.
 *
 * Setup:
 *   1. Create an API key in Grafana (Configuration > API Keys, role: Editor)
 *   2. Note the dashboard ID from your dashboard URL
 */

const cronwrap = require('../index');
const { grafanaNotifier } = require('../notifiers/grafana');

const notify = grafanaNotifier({
  grafanaUrl: process.env.GRAFANA_URL || 'https://grafana.example.com',
  apiKey: process.env.GRAFANA_API_KEY || 'your-grafana-api-key',
  dashboardId: 42,          // optional: pin annotation to a specific dashboard
  panelId: 7,               // optional: pin annotation to a specific panel
  tags: ['production', 'nightly-sync'],
});

cronwrap({
  name: 'nightly-data-sync',
  notifiers: [notify],
  run: async () => {
    console.log('Starting nightly data sync...');
    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('Data sync complete.');
  },
});

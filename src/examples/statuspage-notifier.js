/**
 * Example: Using cronwrap with the Statuspage notifier
 *
 * This will create an incident on your Atlassian Statuspage
 * if the cron job fails or times out.
 *
 * Required environment variables:
 *   STATUSPAGE_API_KEY  - Your Statuspage API key
 *   STATUSPAGE_PAGE_ID  - Your Statuspage page ID
 */

const cronwrap = require('../index');
const { statuspageNotifier } = require('../notifiers/statuspage');

const notify = statuspageNotifier({
  apiKey: process.env.STATUSPAGE_API_KEY,
  pageId: process.env.STATUSPAGE_PAGE_ID,
  incidentName: 'Nightly Data Sync Failed',
  status: 'investigating',
  impactOverride: 'minor',
  // Optional: tie the incident to a specific component
  // componentId: process.env.STATUSPAGE_COMPONENT_ID,
  // componentStatus: 'partial_outage',
});

cronwrap({
  timeout: '5m',
  onFailure: notify,
  onTimeout: notify,
}, async () => {
  console.log('Running nightly data sync...');

  // Simulate your cron job work here
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('Data sync complete.');
});

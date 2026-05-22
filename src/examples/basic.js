'use strict';

/**
 * Basic usage example for cronwrap.
 * In a real project, you'd schedule `wrappedSyncData` with node-cron or similar.
 *
 * Example with node-cron:
 *   const cron = require('node-cron');
 *   cron.schedule('* * * * *', wrappedSyncData); // runs every minute
 */

const cronwrap = require('../index');

async function syncData() {
  console.log('Fetching data from API...');
  // Simulate async work
  await new Promise((resolve) => setTimeout(resolve, 200));
  console.log('Data synced successfully.');
}

const wrappedSyncData = cronwrap(syncData, {
  name: 'syncData',

  onSuccess: async (duration) => {
    // e.g. send a heartbeat ping to an uptime monitor
    console.log(`[alert] Job succeeded in ${duration}ms — heartbeat sent.`);
  },

  onFailure: async (err) => {
    // e.g. post to Slack or send an email
    console.error(`[alert] Job failed! Sending notification. Error: ${err.message}`);
  },
});

// Run immediately for demo purposes
wrappedSyncData().catch(() => process.exit(1));

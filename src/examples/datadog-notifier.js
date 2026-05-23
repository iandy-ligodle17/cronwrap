/**
 * Example: using cronwrap with the Datadog notifier
 *
 * This will send an event to Datadog Events when the job fails or times out.
 */
const cronwrap = require('../index');
const { datadogNotifier } = require('../notifiers/datadog');

cronwrap({
  // The job to run
  job: async () => {
    console.log('Running my cron job...');
    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('Cron job finished successfully.');
  },

  // Timeout in milliseconds (optional)
  timeout: 10000,

  // Called when the job throws an error or times out
  onError: (err) => {
    return datadogNotifier({
      apiKey: process.env.DATADOG_API_KEY,
      title: 'Cron job failed',
      text: `Error: ${err.message}`,
      alertType: 'error',
      tags: ['service:my-cron', 'env:production'],
    });
  },
});

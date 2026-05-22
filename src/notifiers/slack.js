/**
 * Slack notifier for cronwrap
 * Sends failure alerts to a Slack webhook URL
 */

const https = require('https');
const url = require('url');

/**
 * Send a message to a Slack webhook
 * @param {string} webhookUrl - Slack incoming webhook URL
 * @param {object} payload - Message payload
 * @returns {Promise<void>}
 */
async function sendSlackMessage(webhookUrl, payload) {
  const parsedUrl = url.parse(webhookUrl);
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`Slack webhook returned status ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Build and send a failure alert to Slack
 * @param {string} webhookUrl - Slack incoming webhook URL
 * @param {string} jobName - Name of the cron job that failed
 * @param {Error} error - The error that occurred
 * @param {number} durationMs - How long the job ran before failing
 * @returns {Promise<void>}
 */
async function notifySlack(webhookUrl, jobName, error, durationMs) {
  const payload = {
    text: `:rotating_light: *Cron job failed: ${jobName}*`,
    attachments: [
      {
        color: 'danger',
        fields: [
          { title: 'Job', value: jobName, short: true },
          { title: 'Duration', value: `${durationMs}ms`, short: true },
          { title: 'Error', value: error.message || String(error), short: false },
          { title: 'Time', value: new Date().toISOString(), short: true },
        ],
      },
    ],
  };

  await sendSlackMessage(webhookUrl, payload);
}

module.exports = { notifySlack, sendSlackMessage };

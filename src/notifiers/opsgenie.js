const https = require('https');

/**
 * OpsGenie notifier for cronwrap
 * Sends alerts to OpsGenie when a cron job fails
 *
 * @param {Object} options
 * @param {string} options.apiKey - OpsGenie API key
 * @param {string} [options.message] - Alert message (defaults to job name)
 * @param {string} [options.priority] - Alert priority: P1-P5 (default: P3)
 * @param {string[]} [options.tags] - Tags to attach to the alert
 * @param {string} [options.region] - OpsGenie region: 'us' or 'eu' (default: 'us')
 */
function opsgenieNotifier(options = {}) {
  const { apiKey, message, priority = 'P3', tags = [], region = 'us' } = options;

  if (!apiKey) {
    throw new Error('opsgenieNotifier: apiKey is required');
  }

  const hostname =
    region === 'eu' ? 'api.eu.opsgenie.com' : 'api.opsgenie.com';

  return function notify({ jobName, error, output }) {
    return new Promise((resolve, reject) => {
      const alertMessage = message || `Cron job failed: ${jobName}`;

      const body = JSON.stringify({
        message: alertMessage,
        description: [
          `Job: ${jobName}`,
          error ? `Error: ${error.message || error}` : null,
          output ? `Output:\n${output}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
        priority,
        tags: ['cronwrap', ...tags],
        source: 'cronwrap',
      });

      const reqOptions = {
        hostname,
        path: '/v2/alerts',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `GenieKey ${apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body: data });
          } else {
            reject(
              new Error(
                `OpsGenie API error: ${res.statusCode} - ${data}`
              )
            );
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
}

module.exports = { opsgenieNotifier };

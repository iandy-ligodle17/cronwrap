const https = require('https');

/**
 * New Relic notifier for cronwrap
 * Sends alerts to New Relic Alerts via the REST API
 *
 * @param {Object} options
 * @param {string} options.apiKey - New Relic API key
 * @param {string} options.policyId - Alert policy ID
 * @param {string} [options.message] - Custom message override
 */
function newrelicNotifier(options = {}) {
  const { apiKey, policyId, message } = options;

  if (!apiKey) throw new Error('newrelicNotifier: apiKey is required');
  if (!policyId) throw new Error('newrelicNotifier: policyId is required');

  return function notify(error, context) {
    const body = JSON.stringify({
      incident: {
        title: message || `Cron job failed: ${context.name || 'unknown'}`,
        description: error ? error.message : 'Cron job reported a failure',
        policy_id: policyId,
        priority: 'critical',
        metadata: {
          cronwrap: true,
          jobName: context.name || 'unknown',
          timestamp: new Date().toISOString(),
        },
      },
    });

    const reqOptions = {
      hostname: 'api.newrelic.com',
      path: `/v2/alerts_incidents.json`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, body: data });
          } else {
            reject(new Error(`New Relic API error: ${res.statusCode} ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
}

module.exports = { newrelicNotifier };

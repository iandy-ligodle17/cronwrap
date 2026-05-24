const https = require('https');

/**
 * Zenduty notifier for cronwrap
 * Sends alerts to Zenduty incident management platform
 *
 * @param {Object} options
 * @param {string} options.apiKey - Zenduty API key
 * @param {string} options.serviceId - Zenduty service ID
 * @param {string} options.integrationsKey - Zenduty integrations key
 * @param {string} [options.alertType='critical'] - Alert type: 'critical', 'warning', 'info'
 * @returns {Function} notifier function
 */
function zendutyNotifier({ apiKey, serviceId, integrationsKey, alertType = 'critical' }) {
  if (!apiKey) throw new Error('zendutyNotifier requires an apiKey');
  if (!serviceId) throw new Error('zendutyNotifier requires a serviceId');
  if (!integrationsKey) throw new Error('zendutyNotifier requires an integrationsKey');

  return function notify({ jobName, error, output }) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        message: `Cron job failed: ${jobName}`,
        alert_type: alertType,
        summary: error ? error.message : 'Job failed',
        payload: {
          job_name: jobName,
          error: error ? error.message : null,
          output: output || null,
          timestamp: new Date().toISOString(),
        },
      });

      const options = {
        hostname: 'www.zenduty.com',
        path: `/api/events/${integrationsKey}/`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Zenduty responded with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  };
}

module.exports = { zendutyNotifier };

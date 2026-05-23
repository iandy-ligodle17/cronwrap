const https = require('https');

/**
 * Send an alert to Datadog Events API
 * @param {Object} options
 * @param {string} options.apiKey - Datadog API key
 * @param {string} options.title - Event title
 * @param {string} options.text - Event text/body
 * @param {string} [options.alertType='error'] - one of 'error', 'warning', 'info', 'success'
 * @param {string[]} [options.tags=[]] - optional list of tags
 */
function datadogNotifier({ apiKey, title, text, alertType = 'error', tags = [] }) {
  if (!apiKey) throw new Error('datadogNotifier: apiKey is required');
  if (!title) throw new Error('datadogNotifier: title is required');
  if (!text) throw new Error('datadogNotifier: text is required');

  const payload = JSON.stringify({
    title,
    text,
    alert_type: alertType,
    tags,
  });

  const options = {
    hostname: 'api.datadoghq.com',
    path: '/api/v1/events',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DD-API-KEY': apiKey,
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: data });
        } else {
          reject(new Error(`datadogNotifier: request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { datadogNotifier };

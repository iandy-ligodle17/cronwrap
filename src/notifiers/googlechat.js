const https = require('https');

/**
 * Google Chat notifier for cronwrap
 * Sends alerts to a Google Chat webhook URL
 *
 * @param {Object} options
 * @param {string} options.webhookUrl - Google Chat webhook URL
 * @param {string} options.message - Message to send
 * @returns {Promise}
 */
function googlechatNotifier({ webhookUrl, message }) {
  if (!webhookUrl) {
    return Promise.reject(new Error('googlechatNotifier: webhookUrl is required'));
  }
  if (!message) {
    return Promise.reject(new Error('googlechatNotifier: message is required'));
  }

  const payload = JSON.stringify({ text: message });
  const url = new URL(webhookUrl);

  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
          reject(new Error(`googlechatNotifier: request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { googlechatNotifier };

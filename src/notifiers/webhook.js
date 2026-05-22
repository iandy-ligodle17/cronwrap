const https = require('https');
const http = require('http');
const url = require('url');

/**
 * Creates a webhook notifier that sends a POST request to a given URL.
 * @param {string} webhookUrl - The URL to POST the notification to.
 * @param {object} [options={}] - Optional configuration.
 * @param {object} [options.headers={}] - Additional headers to include.
 * @param {function} [options.formatPayload] - Custom payload formatter.
 * @returns {function} A notifier function compatible with cronwrap.
 */
function webhookNotifier(webhookUrl, options = {}) {
  if (!webhookUrl) {
    throw new Error('webhookNotifier requires a webhookUrl');
  }

  const { headers = {}, formatPayload } = options;

  return function notify(message, meta = {}) {
    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(webhookUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const transport = isHttps ? https : http;

      const defaultPayload = {
        text: message,
        timestamp: new Date().toISOString(),
        ...meta,
      };

      const payload = formatPayload
        ? formatPayload(message, meta)
        : defaultPayload;

      const body = JSON.stringify(payload);

      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path || '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...headers,
        },
      };

      const req = transport.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body: data });
          } else {
            reject(new Error(`Webhook request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
}

module.exports = { webhookNotifier };

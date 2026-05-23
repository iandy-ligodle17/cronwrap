'use strict';

const https = require('https');

/**
 * Splunk HEC (HTTP Event Collector) notifier
 * @param {Object} options
 * @param {string} options.token - Splunk HEC token
 * @param {string} options.host - Splunk host (e.g. 'splunk.example.com')
 * @param {string} [options.port='8088'] - Splunk HEC port
 * @param {string} [options.index] - Splunk index to send events to
 * @param {string} [options.source] - Event source
 * @param {string} [options.sourcetype='cronwrap'] - Event sourcetype
 * @returns {Function} notifier function
 */
function splunkNotifier({ token, host, port = '8088', index, source, sourcetype = 'cronwrap' }) {
  if (!token) throw new Error('splunkNotifier: token is required');
  if (!host) throw new Error('splunkNotifier: host is required');

  return function notify(message) {
    return new Promise((resolve, reject) => {
      const event = {
        event: {
          message,
          source: source || 'cronwrap',
        },
        sourcetype,
      };

      if (index) event.index = index;
      if (source) event.source = source;

      const body = JSON.stringify(event);

      const options = {
        hostname: host,
        port,
        path: '/services/collector/event',
        method: 'POST',
        headers: {
          'Authorization': `Splunk ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`splunkNotifier: request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
}

module.exports = { splunkNotifier };

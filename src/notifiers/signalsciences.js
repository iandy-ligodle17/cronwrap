const https = require('https');

/**
 * Signal Sciences (Fastly Next-Gen WAF) notifier
 * Sends an alert event to the Signal Sciences API
 *
 * @param {Object} options
 * @param {string} options.email - Signal Sciences account email
 * @param {string} options.token - Signal Sciences API token
 * @param {string} options.corpName - Signal Sciences corp name
 * @param {string} options.siteName - Signal Sciences site name
 * @param {string} [options.message] - Custom message override
 */
function signalsciencesNotifier({ email, token, corpName, siteName, message }) {
  return function notify({ jobName, error, duration }) {
    const body = JSON.stringify({
      events: [
        {
          eventType: 'cron-failure',
          source: 'cronwrap',
          desc: message || `Cron job "${jobName}" failed after ${duration}ms: ${error}`,
          tags: ['cronwrap', 'cron-failure'],
          timestamp: new Date().toISOString(),
        },
      ],
    });

    const options = {
      hostname: 'dashboard.signalsciences.net',
      path: `/api/v0/corps/${corpName}/sites/${siteName}/feed/events`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-user': email,
        'x-api-token': token,
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Signal Sciences API error: ${res.statusCode} ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
}

module.exports = { signalsciencesNotifier };

const https = require('https');

/**
 * Rollbar notifier for cronwrap
 * Sends error notifications to Rollbar error tracking service
 *
 * @param {Object} options
 * @param {string} options.accessToken - Rollbar server-side access token
 * @param {string} [options.environment='production'] - Environment name
 * @param {string} [options.level='error'] - Notification level (debug, info, warning, error, critical)
 * @returns {Function} notifier function
 */
function rollbarNotifier({ accessToken, environment = 'production', level = 'error' }) {
  if (!accessToken) {
    throw new Error('rollbarNotifier: accessToken is required');
  }

  return function notify({ jobName, error, duration }) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        access_token: accessToken,
        data: {
          environment,
          level,
          body: {
            message: {
              body: `Cron job "${jobName}" failed after ${duration}ms: ${error.message}`,
            },
          },
          custom: {
            jobName,
            duration,
            errorStack: error.stack || null,
          },
          notifier: {
            name: 'cronwrap',
          },
        },
      });

      const options = {
        hostname: 'api.rollbar.com',
        path: '/api/1/item/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Rollbar API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  };
}

module.exports = { rollbarNotifier };

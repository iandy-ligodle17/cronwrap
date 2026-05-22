const https = require('https');

/**
 * PagerDuty notifier for cronwrap
 * Triggers a PagerDuty incident when a cron job fails
 *
 * @param {Object} options
 * @param {string} options.integrationKey - PagerDuty Events API v2 integration key
 * @param {string} [options.severity='error'] - Severity level: critical, error, warning, info
 * @param {string} [options.source='cronwrap'] - Source identifier
 */
function pagerdutyNotifier(options = {}) {
  const { integrationKey, severity = 'error', source = 'cronwrap' } = options;

  if (!integrationKey) {
    throw new Error('pagerdutyNotifier requires an integrationKey');
  }

  return function notify({ jobName, error, duration }) {
    const payload = {
      routing_key: integrationKey,
      event_action: 'trigger',
      payload: {
        summary: `Cron job "${jobName}" failed: ${error.message}`,
        severity,
        source,
        timestamp: new Date().toISOString(),
        custom_details: {
          job_name: jobName,
          error_message: error.message,
          error_stack: error.stack,
          duration_ms: duration,
        },
      },
    };

    const body = JSON.stringify(payload);

    const reqOptions = {
      hostname: 'events.pagerduty.com',
      path: '/v2/enqueue',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`PagerDuty API error: ${res.statusCode} ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
}

module.exports = { pagerdutyNotifier };

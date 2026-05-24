const https = require('https');
const url = require('url');

/**
 * Grafana notifier — sends an annotation to a Grafana instance when a cron job fails.
 *
 * @param {object} options
 * @param {string} options.grafanaUrl  - Base URL of your Grafana instance (e.g. https://grafana.example.com)
 * @param {string} options.apiKey      - Grafana API key with Editor role
 * @param {number|number[]} options.dashboardId - Dashboard ID(s) to tag the annotation on (optional)
 * @param {number|number[]} options.panelId     - Panel ID(s) to tag the annotation on (optional)
 * @param {string[]} [options.tags]    - Extra tags to attach to the annotation
 * @returns {function} notifier function compatible with cronwrap
 */
function grafanaNotifier(options = {}) {
  const { grafanaUrl, apiKey, dashboardId, panelId, tags = [] } = options;

  if (!grafanaUrl) throw new Error('grafanaNotifier: grafanaUrl is required');
  if (!apiKey) throw new Error('grafanaNotifier: apiKey is required');

  return function notify(jobName, error) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new url.URL(grafanaUrl);
      const annotationText = error
        ? `Cron job "${jobName}" failed: ${error.message || error}`
        : `Cron job "${jobName}" completed successfully`;

      const body = JSON.stringify({
        dashboardId: dashboardId || undefined,
        panelId: panelId || undefined,
        time: Date.now(),
        tags: ['cronwrap', jobName, error ? 'failure' : 'success', ...tags],
        text: annotationText,
      });

      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: '/api/annotations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Bearer ${apiKey}`,
        },
      };

      const protocol = parsedUrl.protocol === 'https:' ? https : require('http');
      const req = protocol.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Grafana API responded with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
}

module.exports = { grafanaNotifier };

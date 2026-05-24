const https = require('https');

/**
 * Atlassian Statuspage notifier
 * Creates an incident on a Statuspage.io status page when a cron job fails.
 *
 * @param {Object} options
 * @param {string} options.apiKey - Statuspage API key
 * @param {string} options.pageId - Statuspage page ID
 * @param {string} [options.incidentName] - Name for the incident (default: 'Cron Job Failure')
 * @param {string} [options.status] - Incident status (default: 'investigating')
 * @param {string} [options.impactOverride] - Impact level: none, minor, major, critical (default: 'minor')
 * @param {string} [options.componentId] - Optional component ID to update
 * @param {string} [options.componentStatus] - Component status if componentId is provided (default: 'partial_outage')
 */
function statuspageNotifier(options = {}) {
  const {
    apiKey,
    pageId,
    incidentName = 'Cron Job Failure',
    status = 'investigating',
    impactOverride = 'minor',
    componentId,
    componentStatus = 'partial_outage',
  } = options;

  if (!apiKey) throw new Error('statuspageNotifier: apiKey is required');
  if (!pageId) throw new Error('statuspageNotifier: pageId is required');

  return function notify(message) {
    return new Promise((resolve, reject) => {
      const incident = {
        incident: {
          name: incidentName,
          status,
          impact_override: impactOverride,
          body: message,
        },
      };

      if (componentId) {
        incident.incident.components = { [componentId]: componentStatus };
        incident.incident.component_ids = [componentId];
      }

      const payload = JSON.stringify(incident);

      const reqOptions = {
        hostname: 'api.statuspage.io',
        path: `/v1/pages/${pageId}/incidents`,
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`statuspageNotifier: request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  };
}

module.exports = { statuspageNotifier };

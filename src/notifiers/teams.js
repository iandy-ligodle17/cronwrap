const https = require('https');

/**
 * Microsoft Teams notifier for cronwrap
 * Sends alerts to a Teams channel via incoming webhook
 */
function teamsNotifier({ webhookUrl }) {
  if (!webhookUrl) {
    throw new Error('teamsNotifier requires a webhookUrl');
  }

  return function notify({ jobName, error, duration }) {
    return new Promise((resolve, reject) => {
      const isFailure = !!error;

      const card = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: isFailure ? 'FF0000' : '00FF00',
        summary: isFailure
          ? `Cron job "${jobName}" failed`
          : `Cron job "${jobName}" succeeded`,
        sections: [
          {
            activityTitle: isFailure
              ? `❌ Cron job "${jobName}" failed`
              : `✅ Cron job "${jobName}" succeeded`,
            facts: [
              { name: 'Job', value: jobName },
              { name: 'Status', value: isFailure ? 'Failed' : 'Success' },
              { name: 'Duration', value: `${duration}ms` },
              ...(isFailure ? [{ name: 'Error', value: error.message }] : []),
            ],
          },
        ],
      };

      const body = JSON.stringify(card);
      const url = new URL(webhookUrl);

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body: data });
          } else {
            reject(new Error(`Teams webhook responded with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
}

module.exports = { teamsNotifier };

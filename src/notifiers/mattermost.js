const https = require('https');
const url = require('url');

/**
 * Mattermost notifier for cronwrap
 * Sends alerts to a Mattermost channel via incoming webhooks
 *
 * @param {Object} options
 * @param {string} options.webhookUrl - Mattermost incoming webhook URL
 * @param {string} [options.channel] - Override the default channel
 * @param {string} [options.username] - Override the default username
 * @param {string} [options.iconEmoji] - Override the default icon emoji
 */
function mattermostNotifier(options = {}) {
  const { webhookUrl, channel, username = 'cronwrap', iconEmoji = ':alarm_clock:' } = options;

  if (!webhookUrl) {
    throw new Error('mattermostNotifier requires a webhookUrl');
  }

  return function notify({ jobName, error, duration, output }) {
    return new Promise((resolve, reject) => {
      const text = error
        ? `🚨 *Cron job failed*: \`${jobName}\`\n>*Error:* ${error.message}\n>*Duration:* ${duration}ms`
        : `✅ *Cron job succeeded*: \`${jobName}\`\n>*Duration:* ${duration}ms`;

      const payload = JSON.stringify({
        text,
        ...(channel && { channel }),
        username,
        icon_emoji: iconEmoji,
        ...(output && { attachments: [{ text: output, color: error ? '#FF0000' : '#36a64f' }] }),
      });

      const parsedUrl = url.parse(webhookUrl);
      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body: data });
          } else {
            reject(new Error(`Mattermost webhook failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  };
}

module.exports = { mattermostNotifier };

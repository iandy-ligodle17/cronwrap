const https = require('https');

/**
 * Send a Discord notification via webhook
 * @param {string} webhookUrl - Discord webhook URL
 * @param {string} message - Message to send
 * @param {object} options - Optional configuration
 * @param {string} options.username - Override webhook username
 * @param {string} options.avatarUrl - Override webhook avatar URL
 * @returns {Promise}
 */
function discordNotifier(webhookUrl, message, options = {}) {
  return new Promise((resolve, reject) => {
    if (!webhookUrl) {
      return reject(new Error('Discord webhook URL is required'));
    }

    if (!message) {
      return reject(new Error('Message is required'));
    }

    if (message.length > 2000) {
      return reject(new Error(`Discord message exceeds 2000 character limit (got ${message.length})`));
    }

    const payload = JSON.stringify({
      content: message,
      username: options.username || 'cronwrap',
      avatar_url: options.avatarUrl || undefined,
    });

    let url;
    try {
      url = new URL(webhookUrl);
    } catch (e) {
      return reject(new Error('Invalid Discord webhook URL'));
    }

    const requestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, body: data });
        } else {
          reject(new Error(`Discord notification failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

module.exports = { discordNotifier };

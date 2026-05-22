const https = require('https');

/**
 * Send a Telegram notification via Bot API
 * @param {string} botToken - Telegram bot token
 * @param {string} chatId - Target chat ID
 * @param {string} message - Message text
 * @returns {Promise}
 */
function telegramNotifier(botToken, chatId, message) {
  return new Promise((resolve, reject) => {
    if (!botToken) {
      return reject(new Error('telegramNotifier: botToken is required'));
    }
    if (!chatId) {
      return reject(new Error('telegramNotifier: chatId is required'));
    }
    if (!message) {
      return reject(new Error('telegramNotifier: message is required'));
    }

    const body = JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendMessage`,
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
          resolve(data);
        } else {
          reject(new Error(`telegramNotifier: request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`telegramNotifier: request error: ${err.message}`));
    });

    req.write(body);
    req.end();
  });
}

module.exports = telegramNotifier;

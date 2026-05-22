const https = require('https');

/**
 * SMS notifier using Twilio API
 * @param {Object} options
 * @param {string} options.accountSid - Twilio Account SID
 * @param {string} options.authToken - Twilio Auth Token
 * @param {string} options.from - Twilio phone number to send from
 * @param {string} options.to - Phone number to send to
 * @returns {Function} notifier function
 */
function smsNotifier({ accountSid, authToken, from, to }) {
  if (!accountSid || !authToken || !from || !to) {
    throw new Error('smsNotifier requires accountSid, authToken, from, and to');
  }

  return function notify(message) {
    return new Promise((resolve, reject) => {
      const body = new URLSearchParams({
        From: from,
        To: to,
        Body: message,
      }).toString();

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

      const options = {
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Basic ${auth}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Twilio API error: ${res.statusCode} ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
}

module.exports = { smsNotifier };

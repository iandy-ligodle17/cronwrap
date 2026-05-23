const https = require('https');

/**
 * AWS SNS notifier for cronwrap
 * Sends alerts to an AWS SNS topic via the SNS HTTP API
 *
 * @param {Object} options
 * @param {string} options.topicArn - The ARN of the SNS topic
 * @param {string} options.region - AWS region (e.g. 'us-east-1')
 * @param {string} options.accessKeyId - AWS access key ID
 * @param {string} options.secretAccessKey - AWS secret access key
 * @param {string} [options.subject] - Optional subject for the SNS message
 */
function snsNotifier(options = {}) {
  const { topicArn, region, accessKeyId, secretAccessKey, subject } = options;

  if (!topicArn) throw new Error('snsNotifier: topicArn is required');
  if (!region) throw new Error('snsNotifier: region is required');
  if (!accessKeyId) throw new Error('snsNotifier: accessKeyId is required');
  if (!secretAccessKey) throw new Error('snsNotifier: secretAccessKey is required');

  return function notify(message) {
    return new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        Action: 'Publish',
        TopicArn: topicArn,
        Message: message,
        ...(subject ? { Subject: subject } : {}),
      });

      const body = params.toString();
      const host = `sns.${region}.amazonaws.com`;

      const reqOptions = {
        hostname: host,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
          'X-Amz-Access-Key': accessKeyId,
        },
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`SNS request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  };
}

module.exports = { snsNotifier };

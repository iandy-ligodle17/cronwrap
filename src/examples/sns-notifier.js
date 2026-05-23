/**
 * Example: using cronwrap with the AWS SNS notifier
 *
 * This will send an SNS notification to the specified topic
 * if the cron job fails or times out.
 */

const cronwrap = require('../index');
const { snsNotifier } = require('../notifiers/sns');

const notify = snsNotifier({
  topicArn: 'arn:aws:sns:us-east-1:123456789012:my-cron-alerts',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  subject: 'Cron Job Alert',
});

cronwrap({
  name: 'my-sns-cron-job',
  timeout: '30s',
  onFailure: notify,
  onTimeout: notify,
  job: async () => {
    console.log('Running cron job...');
    // your cron job logic here
    console.log('Cron job complete.');
  },
});

/**
 * Example: using cronwrap with SMS (Twilio) notifications
 *
 * Install deps: npm install cronwrap
 * Set env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, ALERT_PHONE
 */

const cronwrap = require('../index');
const { smsNotifier } = require('../notifiers/sms');

const notify = smsNotifier({
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  from: process.env.TWILIO_FROM,
  to: process.env.ALERT_PHONE,
});

cronwrap({
  name: 'daily-report',
  notifiers: [notify],
  run: async () => {
    console.log('Running daily report job...');

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Uncomment to simulate a failure:
    // throw new Error('Report generation failed');

    console.log('Daily report completed successfully.');
  },
});

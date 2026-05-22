/**
 * Example: using cronwrap with the email notifier.
 *
 * Requires nodemailer to be installed:
 *   npm install nodemailer
 */

const cronwrap = require('../index');
const emailNotifier = require('../notifiers/email');

const notify = emailNotifier({
  to: 'ops-team@example.com',
  from: 'cronwrap@example.com',
  smtpConfig: {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  // optional: override the default subject
  // subject: '[ALERT] Cron job failed',
});

cronwrap({
  name: 'nightly-report',
  notifiers: [notify],
  job: async () => {
    console.log('Running nightly report...');
    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('Report complete.');
  },
});

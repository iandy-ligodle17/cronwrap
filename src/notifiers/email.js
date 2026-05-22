const nodemailer = require('nodemailer');

/**
 * Send an email notification when a cron job fails.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.from - Sender email address
 * @param {Object} options.smtpConfig - Nodemailer SMTP transport config
 * @param {string} [options.subject] - Custom subject line
 * @returns {Function} notifier function compatible with cronwrap
 */
function emailNotifier(options = {}) {
  const { to, from, smtpConfig, subject } = options;

  if (!to) throw new Error('emailNotifier: "to" is required');
  if (!from) throw new Error('emailNotifier: "from" is required');
  if (!smtpConfig) throw new Error('emailNotifier: "smtpConfig" is required');

  const transporter = nodemailer.createTransport(smtpConfig);

  return async function notify({ jobName, error, duration }) {
    const subjectLine = subject || `[cronwrap] Job "${jobName}" failed`;

    const text = [
      `Job: ${jobName}`,
      `Status: FAILED`,
      `Duration: ${duration}ms`,
      `Error: ${error ? error.message : 'Unknown error'}`,
      error && error.stack ? `\nStack:\n${error.stack}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const mailOptions = {
      from,
      to,
      subject: subjectLine,
      text,
    };

    await transporter.sendMail(mailOptions);
  };
}

module.exports = emailNotifier;

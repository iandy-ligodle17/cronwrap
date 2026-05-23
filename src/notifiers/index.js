const { slackNotifier } = require('./slack');
const { emailNotifier } = require('./email');
const { webhookNotifier } = require('./webhook');
const { pagerdutyNotifier } = require('./pagerduty');
const { opsgenieNotifier } = require('./opsgenie');
const { telegramNotifier } = require('./telegram');
const { discordNotifier } = require('./discord');
const { teamsNotifier } = require('./teams');
const { smsNotifier } = require('./sms');
const { victoropsNotifier } = require('./victorops');
const { datadogNotifier } = require('./datadog');

module.exports = {
  slackNotifier,
  emailNotifier,
  webhookNotifier,
  pagerdutyNotifier,
  opsgenieNotifier,
  telegramNotifier,
  discordNotifier,
  teamsNotifier,
  smsNotifier,
  victoropsNotifier,
  datadogNotifier,
};

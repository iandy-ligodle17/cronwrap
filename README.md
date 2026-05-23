# cronwrap

Lightweight wrapper to add logging and failure alerts to cron jobs.

## Install

```bash
npm install cronwrap
```

## Usage

```js
const cronwrap = require('cronwrap');

cronwrap({
  name: 'my-job',
  run: async () => {
    // your cron job logic
  },
  onFailure: (err) => {
    console.error('Job failed:', err.message);
  },
});
```

## Notifiers

cronwrap ships with several built-in notifiers:

| Notifier | Description |
|---|---|
| `slackNotifier` | Post a message to a Slack channel |
| `emailNotifier` | Send an email via SMTP |
| `webhookNotifier` | POST to an arbitrary webhook URL |
| `pagerdutyNotifier` | Trigger a PagerDuty incident |
| `opsgenieNotifier` | Create an OpsGenie alert |
| `telegramNotifier` | Send a Telegram message |
| `discordNotifier` | Post to a Discord webhook |
| `teamsNotifier` | Post to a Microsoft Teams channel |
| `smsNotifier` | Send an SMS via Twilio |
| `victoropsNotifier` | Trigger a VictorOps (Splunk On-Call) alert |

### VictorOps

```js
const { victoropsNotifier } = require('cronwrap/notifiers');

cronwrap({
  name: 'nightly-backup',
  run: async () => { /* ... */ },
  onFailure: (err) =>
    victoropsNotifier({
      restEndpointUrl: process.env.VICTOROPS_REST_ENDPOINT_URL,
      messageType: 'CRITICAL',           // CRITICAL | WARNING | INFO | RECOVERY
      entityDisplayName: 'nightly-backup failed',
      stateMessage: err.message,
    }),
});
```

## License

MIT

# cronwrap

Lightweight wrapper to add logging and failure alerts to cron jobs.

## Installation

```bash
npm install cronwrap
```

## Usage

Wrap any cron job command to get automatic logging and failure notifications.

```javascript
const cronwrap = require('cronwrap');

const job = cronwrap({
  name: 'daily-backup',
  command: 'bash /scripts/backup.sh',
  onFailure: (err, output) => {
    // Send alert via email, Slack, PagerDuty, etc.
    console.error(`Job failed: ${err.message}`);
    console.error(output);
  },
  onSuccess: (output) => {
    console.log('Backup completed successfully');
  },
});

job.run();
```

You can also use it directly from the command line via your crontab:

```
0 2 * * * npx cronwrap --name "daily-backup" --cmd "bash /scripts/backup.sh" --notify "https://hooks.slack.com/..."
```

### Options

| Option      | Type     | Description                              |
|-------------|----------|------------------------------------------|
| `name`      | string   | Identifier for the job in logs           |
| `command`   | string   | Shell command to execute                 |
| `onFailure` | function | Callback triggered on non-zero exit code |
| `onSuccess` | function | Callback triggered on successful exit    |
| `timeout`   | number   | Max execution time in milliseconds       |

## Features

- Structured logging with timestamps
- Captures stdout and stderr output
- Alerts on failure or timeout
- Zero production dependencies

## License

MIT
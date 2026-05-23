# Datadog Notifier

Send cron job failure alerts as events to the [Datadog Events API](https://docs.datadoghq.com/api/latest/events/).

## Usage

```js
const { datadogNotifier } = require('cronwrap/src/notifiers/datadog');
// or via the notifiers index:
const { datadogNotifier } = require('cronwrap/src/notifiers');
```

## Options

| Option      | Type       | Required | Default   | Description                                      |
|-------------|------------|----------|-----------|--------------------------------------------------|
| `apiKey`    | `string`   | ✅        | —         | Your Datadog API key                             |
| `title`     | `string`   | ✅        | —         | Event title shown in Datadog                     |
| `text`      | `string`   | ✅        | —         | Event body / details                             |
| `alertType` | `string`   | ❌        | `'error'` | One of `error`, `warning`, `info`, `success`     |
| `tags`      | `string[]` | ❌        | `[]`      | List of Datadog tags, e.g. `['env:prod']`        |

## Example

```js
const cronwrap = require('cronwrap');
const { datadogNotifier } = require('cronwrap/src/notifiers/datadog');

cronwrap({
  job: async () => {
    // your cron logic here
  },
  onError: (err) =>
    datadogNotifier({
      apiKey: process.env.DATADOG_API_KEY,
      title: 'Cron job failed',
      text: err.message,
      alertType: 'error',
      tags: ['service:my-cron', 'env:production'],
    }),
});
```

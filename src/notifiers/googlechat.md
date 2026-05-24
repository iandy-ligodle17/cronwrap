# Google Chat Notifier

Send cron job failure alerts to a [Google Chat](https://chat.google.com/) space using an incoming webhook.

## Setup

1. Open Google Chat and navigate to the space you want to receive alerts in.
2. Click the space name at the top, then **Manage webhooks**.
3. Click **Add webhook**, give it a name (e.g. `cronwrap`), and copy the generated webhook URL.

## Usage

```js
const cronwrap = require('cronwrap');
const { googlechatNotifier } = require('cronwrap/src/notifiers/googlechat');

cronwrap({
  name: 'my-cron-job',
  run: async () => {
    // your cron job logic here
  },
  onError: (err) =>
    googlechatNotifier({
      webhookUrl: process.env.GOOGLE_CHAT_WEBHOOK_URL,
      message: `Cron job failed: ${err.message}`,
    }),
});
```

## Options

| Option       | Type     | Required | Description                                      |
|------------- |--------- |--------- |------------------------------------------------- |
| `webhookUrl` | `string` | Yes      | The Google Chat incoming webhook URL             |
| `message`    | `string` | Yes      | The text message to post to the Chat space       |

## Notes

- Messages support [Google Chat text formatting](https://developers.google.com/chat/format-messages), including bold (`*text*`), italic (`_text_`), and code blocks (` ``` `).
- Make sure the webhook URL is kept secret — treat it like a password.

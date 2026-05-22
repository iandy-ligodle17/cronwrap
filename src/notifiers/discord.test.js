const { discordNotifier } = require('./discord');

const WEBHOOK_URL = 'https://discord.com/api/webhooks/123456/abcdef';

function mockHttpsRequest(statusCode, responseBody = '') {
  const https = require('https');
  const { EventEmitter } = require('events');

  jest.spyOn(https, 'request').mockImplementation((options, callback) => {
    const res = new EventEmitter();
    res.statusCode = statusCode;
    callback(res);
    res.emit('data', responseBody);
    res.emit('end');

    const req = new EventEmitter();
    req.write = jest.fn();
    req.end = jest.fn();
    return req;
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('discordNotifier', () => {
  test('sends a message successfully', async () => {
    mockHttpsRequest(204);
    const result = await discordNotifier(WEBHOOK_URL, 'Job completed successfully');
    expect(result.statusCode).toBe(204);
  });

  test('sends a message with custom username', async () => {
    const https = require('https');
    mockHttpsRequest(204);
    await discordNotifier(WEBHOOK_URL, 'Hello!', { username: 'my-bot' });
    const callArgs = https.request.mock.calls[0];
    expect(callArgs[0].hostname).toBe('discord.com');
  });

  test('rejects when no webhook URL is provided', async () => {
    await expect(discordNotifier(null, 'test')).rejects.toThrow('Discord webhook URL is required');
  });

  test('rejects on invalid webhook URL', async () => {
    await expect(discordNotifier('not-a-url', 'test')).rejects.toThrow('Invalid Discord webhook URL');
  });

  test('rejects on non-2xx status code', async () => {
    mockHttpsRequest(400, 'Bad Request');
    await expect(discordNotifier(WEBHOOK_URL, 'test')).rejects.toThrow('Discord notification failed with status 400');
  });

  test('rejects on request error', async () => {
    const https = require('https');
    const { EventEmitter } = require('events');
    jest.spyOn(https, 'request').mockImplementation(() => {
      const req = new EventEmitter();
      req.write = jest.fn();
      req.end = jest.fn(() => req.emit('error', new Error('network failure')));
      return req;
    });
    await expect(discordNotifier(WEBHOOK_URL, 'test')).rejects.toThrow('network failure');
  });
});

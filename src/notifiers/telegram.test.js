const telegramNotifier = require('./telegram');

function mockHttpsRequest({ statusCode = 200, responseData = '{}', shouldError = false } = {}) {
  const https = require('https');
  const EventEmitter = require('events');

  jest.spyOn(https, 'request').mockImplementation((options, callback) => {
    const res = new EventEmitter();
    res.statusCode = statusCode;

    const req = new EventEmitter();
    req.write = jest.fn();
    req.end = jest.fn(() => {
      if (shouldError) {
        req.emit('error', new Error('network failure'));
      } else {
        callback(res);
        res.emit('data', responseData);
        res.emit('end');
      }
    });

    return req;
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('telegramNotifier', () => {
  it('sends a message successfully', async () => {
    mockHttpsRequest({ statusCode: 200, responseData: JSON.stringify({ ok: true }) });
    await expect(
      telegramNotifier('bot123:TOKEN', '456789', 'Hello from cronwrap!')
    ).resolves.toBeDefined();
  });

  it('rejects when botToken is missing', async () => {
    await expect(
      telegramNotifier(null, '456789', 'test')
    ).rejects.toThrow('botToken is required');
  });

  it('rejects when chatId is missing', async () => {
    await expect(
      telegramNotifier('bot123:TOKEN', null, 'test')
    ).rejects.toThrow('chatId is required');
  });

  it('rejects when message is missing', async () => {
    await expect(
      telegramNotifier('bot123:TOKEN', '456789', null)
    ).rejects.toThrow('message is required');
  });

  it('rejects on non-2xx status code', async () => {
    mockHttpsRequest({ statusCode: 401, responseData: JSON.stringify({ ok: false, description: 'Unauthorized' }) });
    await expect(
      telegramNotifier('badtoken', '456789', 'test')
    ).rejects.toThrow('status 401');
  });

  it('rejects on network error', async () => {
    mockHttpsRequest({ shouldError: true });
    await expect(
      telegramNotifier('bot123:TOKEN', '456789', 'test')
    ).rejects.toThrow('network failure');
  });
});

'use strict';

const { splunkNotifier } = require('./splunk');

function mockHttpsRequest({ statusCode = 200, responseData = '{"text":"Success"}', error = null } = {}) {
  const https = require('https');
  const EventEmitter = require('events');

  jest.spyOn(https, 'request').mockImplementation((options, callback) => {
    const res = new EventEmitter();
    res.statusCode = statusCode;

    const req = new EventEmitter();
    req.write = jest.fn();
    req.end = jest.fn(() => {
      if (error) {
        req.emit('error', error);
      } else {
        callback(res);
        res.emit('data', responseData);
        res.emit('end');
      }
    });

    return req;
  });
}

describe('splunkNotifier', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws if token is missing', () => {
    expect(() => splunkNotifier({ host: 'splunk.example.com' })).toThrow('splunkNotifier: token is required');
  });

  it('throws if host is missing', () => {
    expect(() => splunkNotifier({ token: 'abc123' })).toThrow('splunkNotifier: host is required');
  });

  it('sends event to Splunk HEC and resolves on success', async () => {
    mockHttpsRequest({ statusCode: 200, responseData: '{"text":"Success"}' });
    const notify = splunkNotifier({ token: 'abc123', host: 'splunk.example.com' });
    await expect(notify('cron job failed')).resolves.toBe('{"text":"Success"}');
  });

  it('rejects on non-2xx status', async () => {
    mockHttpsRequest({ statusCode: 403, responseData: 'Forbidden' });
    const notify = splunkNotifier({ token: 'bad-token', host: 'splunk.example.com' });
    await expect(notify('cron job failed')).rejects.toThrow('splunkNotifier: request failed with status 403');
  });

  it('rejects on request error', async () => {
    mockHttpsRequest({ error: new Error('network error') });
    const notify = splunkNotifier({ token: 'abc123', host: 'splunk.example.com' });
    await expect(notify('cron job failed')).rejects.toThrow('network error');
  });

  it('includes index and source when provided', async () => {
    const https = require('https');
    mockHttpsRequest({ statusCode: 200, responseData: '{"text":"Success"}' });
    const notify = splunkNotifier({
      token: 'abc123',
      host: 'splunk.example.com',
      index: 'main',
      source: 'my-cron',
    });
    await notify('test message');
    const callArgs = https.request.mock.calls[0][0];
    expect(callArgs.headers['Authorization']).toBe('Splunk abc123');
    expect(callArgs.port).toBe('8088');
  });
});

const { datadogNotifier } = require('./datadog');

function mockHttpsRequest(statusCode, responseBody) {
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

beforeEach(() => {
  jest.restoreAllMocks();
});

describe('datadogNotifier', () => {
  it('throws if apiKey is missing', () => {
    expect(() => datadogNotifier({ title: 'T', text: 'B' })).toThrow('apiKey is required');
  });

  it('throws if title is missing', () => {
    expect(() => datadogNotifier({ apiKey: 'key', text: 'B' })).toThrow('title is required');
  });

  it('throws if text is missing', () => {
    expect(() => datadogNotifier({ apiKey: 'key', title: 'T' })).toThrow('text is required');
  });

  it('resolves on 200 response', async () => {
    mockHttpsRequest(200, JSON.stringify({ status: 'ok' }));
    const result = await datadogNotifier({ apiKey: 'key', title: 'Job failed', text: 'Error details' });
    expect(result.statusCode).toBe(200);
  });

  it('rejects on non-2xx response', async () => {
    mockHttpsRequest(403, 'Forbidden');
    await expect(
      datadogNotifier({ apiKey: 'bad-key', title: 'Job failed', text: 'Error details' })
    ).rejects.toThrow('status 403');
  });

  it('sends correct alertType and tags', async () => {
    const https = require('https');
    mockHttpsRequest(200, '{}');
    const writeSpy = jest.fn();
    https.request.mockImplementationOnce((opts, cb) => {
      const { EventEmitter } = require('events');
      const res = new EventEmitter();
      res.statusCode = 200;
      cb(res);
      res.emit('data', '{}');
      res.emit('end');
      const req = new EventEmitter();
      req.write = writeSpy;
      req.end = jest.fn();
      return req;
    });
    await datadogNotifier({ apiKey: 'k', title: 'T', text: 'B', alertType: 'warning', tags: ['env:prod'] });
    const body = JSON.parse(writeSpy.mock.calls[0][0]);
    expect(body.alert_type).toBe('warning');
    expect(body.tags).toEqual(['env:prod']);
  });
});

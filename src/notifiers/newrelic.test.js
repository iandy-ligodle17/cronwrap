const { newrelicNotifier } = require('./newrelic');

function mockHttpsRequest(statusCode, responseBody) {
  return {
    request: (options, callback) => {
      const res = {
        statusCode,
        on: (event, handler) => {
          if (event === 'data') handler(responseBody);
          if (event === 'end') handler();
        },
      };
      callback(res);
      return {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };
    },
  };
}

describe('newrelicNotifier', () => {
  it('throws if apiKey is missing', () => {
    expect(() => newrelicNotifier({ policyId: '123' })).toThrow('apiKey is required');
  });

  it('throws if policyId is missing', () => {
    expect(() => newrelicNotifier({ apiKey: 'abc' })).toThrow('policyId is required');
  });

  it('returns a function when valid options are provided', () => {
    const notify = newrelicNotifier({ apiKey: 'abc', policyId: '123' });
    expect(typeof notify).toBe('function');
  });

  it('resolves on successful API response', async () => {
    const https = require('https');
    const mock = mockHttpsRequest(201, JSON.stringify({ incident: { id: 1 } }));
    jest.spyOn(https, 'request').mockImplementation(mock.request);

    const notify = newrelicNotifier({ apiKey: 'abc', policyId: '123' });
    const result = await notify(new Error('job failed'), { name: 'my-cron' });

    expect(result.status).toBe(201);
    https.request.mockRestore();
  });

  it('rejects on non-2xx API response', async () => {
    const https = require('https');
    const mock = mockHttpsRequest(403, 'Forbidden');
    jest.spyOn(https, 'request').mockImplementation(mock.request);

    const notify = newrelicNotifier({ apiKey: 'bad-key', policyId: '123' });
    await expect(notify(new Error('fail'), { name: 'test' })).rejects.toThrow('New Relic API error: 403');

    https.request.mockRestore();
  });

  it('uses custom message when provided', async () => {
    const https = require('https');
    let capturedBody = '';
    jest.spyOn(https, 'request').mockImplementation((options, callback) => {
      const res = {
        statusCode: 201,
        on: (event, handler) => {
          if (event === 'data') handler('{}');
          if (event === 'end') handler();
        },
      };
      callback(res);
      return {
        on: jest.fn(),
        write: (body) => { capturedBody = body; },
        end: jest.fn(),
      };
    });

    const notify = newrelicNotifier({ apiKey: 'abc', policyId: '123', message: 'Custom alert!' });
    await notify(null, { name: 'my-cron' });

    expect(JSON.parse(capturedBody).incident.title).toBe('Custom alert!');
    https.request.mockRestore();
  });
});

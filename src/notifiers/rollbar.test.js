const { rollbarNotifier } = require('./rollbar');

function mockHttpsRequest(statusCode, responseBody) {
  return jest.fn((options, callback) => {
    const res = {
      statusCode,
      on: (event, handler) => {
        if (event === 'data') handler(JSON.stringify(responseBody));
        if (event === 'end') handler();
      },
    };
    callback(res);
    return {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
  });
}

describe('rollbarNotifier', () => {
  let httpsModule;

  beforeEach(() => {
    httpsModule = require('https');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('throws if accessToken is missing', () => {
    expect(() => rollbarNotifier({})).toThrow('rollbarNotifier: accessToken is required');
  });

  it('returns a function when properly configured', () => {
    const notify = rollbarNotifier({ accessToken: 'test-token' });
    expect(typeof notify).toBe('function');
  });

  it('sends correct payload to Rollbar API', async () => {
    httpsModule.request = mockHttpsRequest(200, { err: 0, result: { uuid: 'abc123' } });

    const notify = rollbarNotifier({ accessToken: 'test-token', environment: 'staging' });
    const result = await notify({
      jobName: 'my-cron-job',
      error: new Error('Something went wrong'),
      duration: 1234,
    });

    expect(httpsModule.request).toHaveBeenCalledTimes(1);
    const [callOptions] = httpsModule.request.mock.calls[0];
    expect(callOptions.hostname).toBe('api.rollbar.com');
    expect(callOptions.path).toBe('/api/1/item/');
    expect(callOptions.method).toBe('POST');
    expect(result).toEqual({ err: 0, result: { uuid: 'abc123' } });
  });

  it('uses default level of error', async () => {
    let capturedPayload = '';
    const mockReq = {
      on: jest.fn(),
      write: jest.fn((data) => { capturedPayload += data; }),
      end: jest.fn(),
    };
    httpsModule.request = jest.fn((options, callback) => {
      const res = {
        statusCode: 200,
        on: (event, handler) => {
          if (event === 'data') handler(JSON.stringify({ err: 0 }));
          if (event === 'end') handler();
        },
      };
      callback(res);
      return mockReq;
    });

    const notify = rollbarNotifier({ accessToken: 'test-token' });
    await notify({ jobName: 'job', error: new Error('oops'), duration: 500 });

    const parsed = JSON.parse(capturedPayload);
    expect(parsed.data.level).toBe('error');
    expect(parsed.data.environment).toBe('production');
  });

  it('rejects on non-2xx response', async () => {
    httpsModule.request = mockHttpsRequest(500, { err: 1, message: 'Internal error' });

    const notify = rollbarNotifier({ accessToken: 'bad-token' });
    await expect(
      notify({ jobName: 'job', error: new Error('fail'), duration: 100 })
    ).rejects.toThrow('Rollbar API error: 500');
  });
});

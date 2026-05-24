const { grafanaNotifier } = require('./grafana');

function mockHttpsRequest(statusCode, responseBody) {
  return jest.fn((options, callback) => {
    const res = {
      statusCode,
      on: jest.fn((event, handler) => {
        if (event === 'data') handler(JSON.stringify(responseBody));
        if (event === 'end') handler();
      }),
    };
    callback(res);
    return {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
  });
}

describe('grafanaNotifier', () => {
  let httpsRequestSpy;

  afterEach(() => {
    if (httpsRequestSpy) httpsRequestSpy.mockRestore();
  });

  it('throws if grafanaUrl is missing', () => {
    expect(() => grafanaNotifier({ apiKey: 'abc' })).toThrow('grafanaUrl is required');
  });

  it('throws if apiKey is missing', () => {
    expect(() => grafanaNotifier({ grafanaUrl: 'https://grafana.example.com' })).toThrow('apiKey is required');
  });

  it('sends a failure annotation when error is provided', async () => {
    const https = require('https');
    httpsRequestSpy = jest.spyOn(https, 'request').mockImplementation(
      mockHttpsRequest(200, { id: 1, message: 'Annotation added' })
    );

    const notify = grafanaNotifier({
      grafanaUrl: 'https://grafana.example.com',
      apiKey: 'test-api-key',
      tags: ['production'],
    });

    const result = await notify('my-cron-job', new Error('Something went wrong'));
    expect(result).toEqual({ id: 1, message: 'Annotation added' });

    const callArgs = httpsRequestSpy.mock.calls[0][0];
    expect(callArgs.hostname).toBe('grafana.example.com');
    expect(callArgs.path).toBe('/api/annotations');
    expect(callArgs.headers['Authorization']).toBe('Bearer test-api-key');
  });

  it('sends a success annotation when no error is provided', async () => {
    const https = require('https');
    httpsRequestSpy = jest.spyOn(https, 'request').mockImplementation(
      mockHttpsRequest(200, { id: 2, message: 'Annotation added' })
    );

    const notify = grafanaNotifier({
      grafanaUrl: 'https://grafana.example.com',
      apiKey: 'test-api-key',
    });

    const result = await notify('my-cron-job', null);
    expect(result).toEqual({ id: 2, message: 'Annotation added' });
  });

  it('rejects when Grafana returns a non-2xx status', async () => {
    const https = require('https');
    httpsRequestSpy = jest.spyOn(https, 'request').mockImplementation(
      mockHttpsRequest(401, { message: 'Unauthorized' })
    );

    const notify = grafanaNotifier({
      grafanaUrl: 'https://grafana.example.com',
      apiKey: 'bad-key',
    });

    await expect(notify('my-cron-job', new Error('fail'))).rejects.toThrow('status 401');
  });
});

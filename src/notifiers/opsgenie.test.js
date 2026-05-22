const { opsgenieNotifier } = require('./opsgenie');

function mockHttpsRequest(statusCode = 202, responseBody = '{"result":"Request will be processed"}') {
  return jest.fn((options, callback) => {
    const res = {
      statusCode,
      on: jest.fn((event, handler) => {
        if (event === 'data') handler(responseBody);
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

describe('opsgenieNotifier', () => {
  let https;

  beforeEach(() => {
    jest.resetModules();
    https = require('https');
  });

  it('throws if apiKey is not provided', () => {
    expect(() => opsgenieNotifier({})).toThrow('opsgenieNotifier: apiKey is required');
  });

  it('returns a function when configured correctly', () => {
    const notify = opsgenieNotifier({ apiKey: 'test-key' });
    expect(typeof notify).toBe('function');
  });

  it('sends an alert to OpsGenie US endpoint by default', async () => {
    https.request = mockHttpsRequest(202);
    const notify = opsgenieNotifier({ apiKey: 'test-key' });
    const result = await notify({ jobName: 'my-job', error: new Error('boom'), output: '' });
    expect(result.statusCode).toBe(202);
    const callArgs = https.request.mock.calls[0][0];
    expect(callArgs.hostname).toBe('api.opsgenie.com');
    expect(callArgs.path).toBe('/v2/alerts');
    expect(callArgs.headers.Authorization).toBe('GenieKey test-key');
  });

  it('uses EU endpoint when region is eu', async () => {
    https.request = mockHttpsRequest(202);
    const notify = opsgenieNotifier({ apiKey: 'test-key', region: 'eu' });
    await notify({ jobName: 'my-job', error: null, output: 'done' });
    const callArgs = https.request.mock.calls[0][0];
    expect(callArgs.hostname).toBe('api.eu.opsgenie.com');
  });

  it('uses custom message when provided', async () => {
    https.request = mockHttpsRequest(202);
    const notify = opsgenieNotifier({ apiKey: 'test-key', message: 'Custom alert!' });
    await notify({ jobName: 'my-job', error: null, output: '' });
    const writeArg = https.request.mock.results[0].value.write.mock.calls[0][0];
    const body = JSON.parse(writeArg);
    expect(body.message).toBe('Custom alert!');
  });

  it('includes cronwrap tag and any extra tags', async () => {
    https.request = mockHttpsRequest(202);
    const notify = opsgenieNotifier({ apiKey: 'test-key', tags: ['production', 'billing'] });
    await notify({ jobName: 'my-job', error: null, output: '' });
    const writeArg = https.request.mock.results[0].value.write.mock.calls[0][0];
    const body = JSON.parse(writeArg);
    expect(body.tags).toEqual(['cronwrap', 'production', 'billing']);
  });

  it('rejects on non-2xx response', async () => {
    https.request = mockHttpsRequest(400, '{"message":"Bad Request"}');
    const notify = opsgenieNotifier({ apiKey: 'bad-key' });
    await expect(notify({ jobName: 'my-job', error: null, output: '' })).rejects.toThrow(
      'OpsGenie API error: 400'
    );
  });
});

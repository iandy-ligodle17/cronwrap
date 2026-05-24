const { zendutyNotifier } = require('./zenduty');

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
        req.emit('error', new Error('Network error'));
        return;
      }
      callback(res);
      res.emit('data', responseData);
      res.emit('end');
    });

    return req;
  });
}

describe('zendutyNotifier', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws if apiKey is missing', () => {
    expect(() => zendutyNotifier({ serviceId: 'sid', integrationsKey: 'ikey' }))
      .toThrow('zendutyNotifier requires an apiKey');
  });

  it('throws if serviceId is missing', () => {
    expect(() => zendutyNotifier({ apiKey: 'key', integrationsKey: 'ikey' }))
      .toThrow('zendutyNotifier requires a serviceId');
  });

  it('throws if integrationsKey is missing', () => {
    expect(() => zendutyNotifier({ apiKey: 'key', serviceId: 'sid' }))
      .toThrow('zendutyNotifier requires an integrationsKey');
  });

  it('sends a notification successfully', async () => {
    mockHttpsRequest({ statusCode: 200, responseData: '{"status":"success"}' });

    const notify = zendutyNotifier({
      apiKey: 'test-api-key',
      serviceId: 'test-service-id',
      integrationsKey: 'test-integrations-key',
    });

    const result = await notify({
      jobName: 'my-cron-job',
      error: new Error('Something went wrong'),
      output: 'some output',
    });

    expect(result).toBe('{"status":"success"}');
  });

  it('rejects when server returns non-2xx status', async () => {
    mockHttpsRequest({ statusCode: 500, responseData: 'Internal Server Error' });

    const notify = zendutyNotifier({
      apiKey: 'test-api-key',
      serviceId: 'test-service-id',
      integrationsKey: 'test-integrations-key',
    });

    await expect(notify({ jobName: 'my-cron-job', error: new Error('fail') }))
      .rejects.toThrow('Zenduty responded with status 500');
  });

  it('rejects on network error', async () => {
    mockHttpsRequest({ shouldError: true });

    const notify = zendutyNotifier({
      apiKey: 'test-api-key',
      serviceId: 'test-service-id',
      integrationsKey: 'test-integrations-key',
    });

    await expect(notify({ jobName: 'my-cron-job', error: new Error('fail') }))
      .rejects.toThrow('Network error');
  });

  it('uses default alertType of critical', async () => {
    const https = require('https');
    mockHttpsRequest({ statusCode: 200 });

    const notify = zendutyNotifier({
      apiKey: 'key',
      serviceId: 'sid',
      integrationsKey: 'ikey',
    });

    await notify({ jobName: 'job', error: null, output: null });

    const writeCall = https.request.mock.results[0].value.write.mock.calls[0][0];
    const body = JSON.parse(writeCall);
    expect(body.alert_type).toBe('critical');
  });
});

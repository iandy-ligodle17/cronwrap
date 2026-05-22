const { pagerdutyNotifier } = require('./pagerduty');

function mockHttpsRequest(statusCode, responseBody) {
  return {
    request: jest.fn((options, callback) => {
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
    }),
  };
}

describe('pagerdutyNotifier', () => {
  it('throws if integrationKey is missing', () => {
    expect(() => pagerdutyNotifier({})).toThrow('pagerdutyNotifier requires an integrationKey');
  });

  it('returns a function when configured correctly', () => {
    const notify = pagerdutyNotifier({ integrationKey: 'test-key' });
    expect(typeof notify).toBe('function');
  });

  it('sends a correctly structured request to PagerDuty', async () => {
    const https = require('https');
    const mock = mockHttpsRequest(202, { status: 'success', message: 'Event processed' });
    jest.spyOn(https, 'request').mockImplementation(mock.request);

    const notify = pagerdutyNotifier({ integrationKey: 'test-key-123', severity: 'critical' });
    const error = new Error('Job timed out');
    await notify({ jobName: 'my-cron-job', error, duration: 5000 });

    const callArgs = https.request.mock.calls[0];
    expect(callArgs[0].hostname).toBe('events.pagerduty.com');
    expect(callArgs[0].path).toBe('/v2/enqueue');
    expect(callArgs[0].method).toBe('POST');

    jest.restoreAllMocks();
  });

  it('includes job details in the payload', async () => {
    const https = require('https');
    let capturedBody = '';
    const mockReq = {
      on: jest.fn(),
      write: jest.fn((data) => { capturedBody += data; }),
      end: jest.fn(),
    };
    jest.spyOn(https, 'request').mockImplementation((options, callback) => {
      const res = { statusCode: 202, on: jest.fn((e, h) => { if (e === 'data') h('{}'); if (e === 'end') h(); }) };
      callback(res);
      return mockReq;
    });

    const notify = pagerdutyNotifier({ integrationKey: 'key-abc' });
    const error = new Error('Database connection failed');
    await notify({ jobName: 'db-backup', error, duration: 1200 });

    const body = JSON.parse(capturedBody);
    expect(body.routing_key).toBe('key-abc');
    expect(body.payload.summary).toContain('db-backup');
    expect(body.payload.custom_details.duration_ms).toBe(1200);
    expect(body.payload.severity).toBe('error');

    jest.restoreAllMocks();
  });

  it('rejects on non-2xx response', async () => {
    const https = require('https');
    const mock = mockHttpsRequest(400, { message: 'Invalid integration key' });
    jest.spyOn(https, 'request').mockImplementation(mock.request);

    const notify = pagerdutyNotifier({ integrationKey: 'bad-key' });
    await expect(
      notify({ jobName: 'test-job', error: new Error('fail'), duration: 100 })
    ).rejects.toThrow('PagerDuty API error: 400');

    jest.restoreAllMocks();
  });
});

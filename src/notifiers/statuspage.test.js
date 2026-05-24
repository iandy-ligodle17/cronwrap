const { statuspageNotifier } = require('./statuspage');

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

describe('statuspageNotifier', () => {
  let https;

  beforeEach(() => {
    jest.resetModules();
    https = require('https');
  });

  it('throws if apiKey is missing', () => {
    expect(() => statuspageNotifier({ pageId: 'abc123' })).toThrow('apiKey is required');
  });

  it('throws if pageId is missing', () => {
    expect(() => statuspageNotifier({ apiKey: 'key123' })).toThrow('pageId is required');
  });

  it('creates an incident successfully', async () => {
    const mockResponse = { id: 'inc_001', name: 'Cron Job Failure', status: 'investigating' };
    https.request = mockHttpsRequest(201, mockResponse);

    const notify = statuspageNotifier({ apiKey: 'key123', pageId: 'page456' });
    const result = await notify('Job failed: timeout exceeded');

    expect(result).toEqual(mockResponse);
    expect(https.request).toHaveBeenCalledTimes(1);

    const callArgs = https.request.mock.calls[0][0];
    expect(callArgs.hostname).toBe('api.statuspage.io');
    expect(callArgs.path).toBe('/v1/pages/page456/incidents');
    expect(callArgs.method).toBe('POST');
    expect(callArgs.headers['Authorization']).toBe('OAuth key123');
  });

  it('includes component info when componentId is provided', async () => {
    const mockResponse = { id: 'inc_002', status: 'investigating' };
    https.request = mockHttpsRequest(201, mockResponse);

    const notify = statuspageNotifier({
      apiKey: 'key123',
      pageId: 'page456',
      componentId: 'comp789',
      componentStatus: 'major_outage',
    });

    const result = await notify('Critical failure');
    expect(result).toEqual(mockResponse);
  });

  it('rejects on non-2xx response', async () => {
    https.request = mockHttpsRequest(422, { error: 'Unprocessable Entity' });

    const notify = statuspageNotifier({ apiKey: 'key123', pageId: 'page456' });
    await expect(notify('Bad request')).rejects.toThrow('request failed with status 422');
  });

  it('uses custom incidentName and impactOverride', async () => {
    const mockResponse = { id: 'inc_003' };
    https.request = mockHttpsRequest(200, mockResponse);

    const notify = statuspageNotifier({
      apiKey: 'key123',
      pageId: 'page456',
      incidentName: 'Backup Job Failed',
      impactOverride: 'critical',
    });

    const result = await notify('Backup did not complete');
    expect(result).toEqual(mockResponse);
  });
});

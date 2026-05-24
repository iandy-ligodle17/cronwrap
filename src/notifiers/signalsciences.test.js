const { signalsciencesNotifier } = require('./signalsciences');

function mockHttpsRequest(statusCode = 200, responseData = '{}') {
  return jest.fn((options, callback) => {
    const res = {
      statusCode,
      on: jest.fn((event, handler) => {
        if (event === 'data') handler(responseData);
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

describe('signalsciencesNotifier', () => {
  let https;

  beforeEach(() => {
    https = require('https');
    jest.mock('https');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it('should call Signal Sciences API with correct options', async () => {
    const mockRequest = mockHttpsRequest(200);
    https.request = mockRequest;

    const notify = signalsciencesNotifier({
      email: 'user@example.com',
      token: 'test-token',
      corpName: 'my-corp',
      siteName: 'my-site',
    });

    await notify({ jobName: 'backup-job', error: 'Timeout', duration: 3000 });

    expect(mockRequest).toHaveBeenCalledTimes(1);
    const callOptions = mockRequest.mock.calls[0][0];
    expect(callOptions.hostname).toBe('dashboard.signalsciences.net');
    expect(callOptions.path).toBe('/api/v0/corps/my-corp/sites/my-site/feed/events');
    expect(callOptions.method).toBe('POST');
    expect(callOptions.headers['x-api-user']).toBe('user@example.com');
    expect(callOptions.headers['x-api-token']).toBe('test-token');
  });

  it('should use custom message if provided', async () => {
    const mockRequest = mockHttpsRequest(200);
    https.request = mockRequest;

    const notify = signalsciencesNotifier({
      email: 'user@example.com',
      token: 'test-token',
      corpName: 'my-corp',
      siteName: 'my-site',
      message: 'Custom alert message',
    });

    await notify({ jobName: 'backup-job', error: 'Timeout', duration: 3000 });
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it('should reject on non-2xx status code', async () => {
    const mockRequest = mockHttpsRequest(403, 'Forbidden');
    https.request = mockRequest;

    const notify = signalsciencesNotifier({
      email: 'user@example.com',
      token: 'bad-token',
      corpName: 'my-corp',
      siteName: 'my-site',
    });

    await expect(
      notify({ jobName: 'backup-job', error: 'Timeout', duration: 3000 })
    ).rejects.toThrow('Signal Sciences API error: 403');
  });
});

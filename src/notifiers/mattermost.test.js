const { mattermostNotifier } = require('./mattermost');

function mockHttpsRequest({ statusCode = 200, responseBody = 'ok', shouldError = false } = {}) {
  const https = require('https');
  const mockReq = {
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };

  jest.spyOn(https, 'request').mockImplementation((options, callback) => {
    if (shouldError) {
      mockReq.on.mockImplementation((event, handler) => {
        if (event === 'error') handler(new Error('Network error'));
      });
    } else {
      const mockRes = {
        statusCode,
        on: jest.fn((event, handler) => {
          if (event === 'data') handler(responseBody);
          if (event === 'end') handler();
        }),
      };
      callback(mockRes);
    }
    return mockReq;
  });

  return mockReq;
}

describe('mattermostNotifier', () => {
  beforeEach(() => jest.resetAllMocks());

  it('throws if webhookUrl is not provided', () => {
    expect(() => mattermostNotifier()).toThrow('mattermostNotifier requires a webhookUrl');
  });

  it('returns a function when configured correctly', () => {
    const notify = mattermostNotifier({ webhookUrl: 'https://mattermost.example.com/hooks/abc123' });
    expect(typeof notify).toBe('function');
  });

  it('sends a success notification', async () => {
    mockHttpsRequest({ statusCode: 200 });
    const notify = mattermostNotifier({ webhookUrl: 'https://mattermost.example.com/hooks/abc123' });
    const result = await notify({ jobName: 'my-job', error: null, duration: 350, output: '' });
    expect(result.statusCode).toBe(200);
  });

  it('sends a failure notification with error details', async () => {
    const https = require('https');
    mockHttpsRequest({ statusCode: 200 });
    const notify = mattermostNotifier({ webhookUrl: 'https://mattermost.example.com/hooks/abc123' });
    await notify({ jobName: 'my-job', error: new Error('Something broke'), duration: 100, output: 'stack trace here' });
    const payload = JSON.parse(https.request.mock.calls[0][1] ? '' : https.request.mock.results[0].value.write.mock.calls[0][0]);
    expect(payload.text).toContain('failed');
    expect(payload.text).toContain('my-job');
  });

  it('rejects on non-2xx status code', async () => {
    mockHttpsRequest({ statusCode: 500, responseBody: 'Internal Server Error' });
    const notify = mattermostNotifier({ webhookUrl: 'https://mattermost.example.com/hooks/abc123' });
    await expect(notify({ jobName: 'my-job', error: null, duration: 200, output: '' }))
      .rejects.toThrow('Mattermost webhook failed with status 500');
  });

  it('rejects on network error', async () => {
    mockHttpsRequest({ shouldError: true });
    const notify = mattermostNotifier({ webhookUrl: 'https://mattermost.example.com/hooks/abc123' });
    await expect(notify({ jobName: 'my-job', error: null, duration: 200, output: '' }))
      .rejects.toThrow('Network error');
  });

  it('includes channel override when provided', async () => {
    const https = require('https');
    mockHttpsRequest({ statusCode: 200 });
    const notify = mattermostNotifier({
      webhookUrl: 'https://mattermost.example.com/hooks/abc123',
      channel: 'alerts',
    });
    await notify({ jobName: 'my-job', error: null, duration: 150, output: '' });
    const payload = JSON.parse(https.request.mock.results[0].value.write.mock.calls[0][0]);
    expect(payload.channel).toBe('alerts');
  });
});

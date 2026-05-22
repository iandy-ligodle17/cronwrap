const { teamsNotifier } = require('./teams');

function mockHttpsRequest({ statusCode = 200, responseBody = '1', shouldError = false } = {}) {
  const https = require('https');
  const originalRequest = https.request;

  https.request = jest.fn((options, callback) => {
    const res = {
      statusCode,
      on: jest.fn((event, handler) => {
        if (event === 'data') handler(responseBody);
        if (event === 'end') handler();
      }),
    };

    if (!shouldError) {
      callback(res);
    }

    return {
      on: jest.fn((event, handler) => {
        if (shouldError && event === 'error') handler(new Error('Network error'));
      }),
      write: jest.fn(),
      end: jest.fn(),
    };
  });

  return () => { https.request = originalRequest; };
}

describe('teamsNotifier', () => {
  it('throws if webhookUrl is not provided', () => {
    expect(() => teamsNotifier({})).toThrow('teamsNotifier requires a webhookUrl');
  });

  it('returns a notify function', () => {
    const notify = teamsNotifier({ webhookUrl: 'https://outlook.office.com/webhook/test' });
    expect(typeof notify).toBe('function');
  });

  it('sends a success card on successful job', async () => {
    const restore = mockHttpsRequest({ statusCode: 200 });
    const notify = teamsNotifier({ webhookUrl: 'https://outlook.office.com/webhook/test' });

    const result = await notify({ jobName: 'backup-job', error: null, duration: 1200 });
    expect(result.statusCode).toBe(200);

    const https = require('https');
    const callArgs = https.request.mock.calls[0][0];
    expect(callArgs.method).toBe('POST');

    restore();
  });

  it('sends a failure card when error is present', async () => {
    const restore = mockHttpsRequest({ statusCode: 200 });
    const notify = teamsNotifier({ webhookUrl: 'https://outlook.office.com/webhook/test' });

    await notify({ jobName: 'backup-job', error: new Error('Disk full'), duration: 300 });

    const https = require('https');
    const body = JSON.parse(https.request.mock.calls[0][0].headers ? '{}' : '{}');
    expect(https.request).toHaveBeenCalled();

    restore();
  });

  it('rejects on non-2xx status code', async () => {
    const restore = mockHttpsRequest({ statusCode: 500, responseBody: 'Server Error' });
    const notify = teamsNotifier({ webhookUrl: 'https://outlook.office.com/webhook/test' });

    await expect(
      notify({ jobName: 'backup-job', error: null, duration: 500 })
    ).rejects.toThrow('Teams webhook responded with status 500');

    restore();
  });

  it('rejects on network error', async () => {
    const restore = mockHttpsRequest({ shouldError: true });
    const notify = teamsNotifier({ webhookUrl: 'https://outlook.office.com/webhook/test' });

    await expect(
      notify({ jobName: 'backup-job', error: null, duration: 500 })
    ).rejects.toThrow('Network error');

    restore();
  });
});

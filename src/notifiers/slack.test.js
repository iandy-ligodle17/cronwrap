const { notifySlack, sendSlackMessage } = require('./slack');

// Mock https module
jest.mock('https', () => ({
  request: jest.fn(),
}));

const https = require('https');

function mockHttpsRequest(statusCode = 200) {
  const mockReq = {
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };

  https.request.mockImplementation((options, callback) => {
    callback({ statusCode });
    return mockReq;
  });

  return mockReq;
}

describe('sendSlackMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send a POST request to the webhook URL', async () => {
    mockHttpsRequest(200);
    await sendSlackMessage('https://hooks.slack.com/test/webhook', { text: 'hello' });
    expect(https.request).toHaveBeenCalledTimes(1);
    const [options] = https.request.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.hostname).toBe('hooks.slack.com');
  });

  it('should reject on non-2xx status code', async () => {
    mockHttpsRequest(500);
    await expect(
      sendSlackMessage('https://hooks.slack.com/test/webhook', { text: 'hello' })
    ).rejects.toThrow('Slack webhook returned status 500');
  });
});

describe('notifySlack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send a formatted failure message', async () => {
    const mockReq = mockHttpsRequest(200);
    const error = new Error('Something went wrong');

    await notifySlack('https://hooks.slack.com/test/webhook', 'my-job', error, 1234);

    expect(https.request).toHaveBeenCalledTimes(1);
    const writtenBody = JSON.parse(mockReq.write.mock.calls[0][0]);
    expect(writtenBody.text).toContain('my-job');
    expect(writtenBody.attachments[0].color).toBe('danger');
    const fields = writtenBody.attachments[0].fields;
    expect(fields.find(f => f.title === 'Error').value).toBe('Something went wrong');
    expect(fields.find(f => f.title === 'Duration').value).toBe('1234ms');
  });

  it('should handle errors without a message property', async () => {
    mockHttpsRequest(200);
    await expect(
      notifySlack('https://hooks.slack.com/test/webhook', 'my-job', 'raw error string', 500)
    ).resolves.not.toThrow();
  });
});

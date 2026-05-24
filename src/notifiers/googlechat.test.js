const { googlechatNotifier } = require('./googlechat');

let mockHttpsRequest;

jest.mock('https', () => ({
  request: (options, callback) => mockHttpsRequest(options, callback),
}));

function createMockRequest(statusCode, responseBody) {
  return (options, callback) => {
    const res = {
      statusCode,
      on: (event, handler) => {
        if (event === 'data') handler(responseBody);
        if (event === 'end') handler();
      },
    };
    callback(res);
    return {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
  };
}

describe('googlechatNotifier', () => {
  test('sends a message to Google Chat webhook', async () => {
    mockHttpsRequest = createMockRequest(200, 'ok');
    const result = await googlechatNotifier({
      webhookUrl: 'https://chat.googleapis.com/v1/spaces/SPACE/messages?key=KEY',
      message: 'Cron job failed!',
    });
    expect(result.statusCode).toBe(200);
  });

  test('rejects when webhookUrl is missing', async () => {
    await expect(
      googlechatNotifier({ message: 'test' })
    ).rejects.toThrow('webhookUrl is required');
  });

  test('rejects when message is missing', async () => {
    await expect(
      googlechatNotifier({ webhookUrl: 'https://chat.googleapis.com/v1/spaces/SPACE/messages?key=KEY' })
    ).rejects.toThrow('message is required');
  });

  test('rejects on non-2xx status code', async () => {
    mockHttpsRequest = createMockRequest(400, 'Bad Request');
    await expect(
      googlechatNotifier({
        webhookUrl: 'https://chat.googleapis.com/v1/spaces/SPACE/messages?key=KEY',
        message: 'test',
      })
    ).rejects.toThrow('request failed with status 400');
  });

  test('rejects on request error', async () => {
    mockHttpsRequest = (options, callback) => {
      const req = {
        on: (event, handler) => {
          if (event === 'error') handler(new Error('network error'));
        },
        write: jest.fn(),
        end: jest.fn(),
      };
      return req;
    };
    await expect(
      googlechatNotifier({
        webhookUrl: 'https://chat.googleapis.com/v1/spaces/SPACE/messages?key=KEY',
        message: 'test',
      })
    ).rejects.toThrow('network error');
  });
});

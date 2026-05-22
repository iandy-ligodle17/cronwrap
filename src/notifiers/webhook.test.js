const { webhookNotifier } = require('./webhook');

let mockRequestOptions = {};
let mockResponseStatusCode = 200;
let mockResponseBody = 'OK';
let mockRequestError = null;

function mockHttpsRequest(options, callback) {
  mockRequestOptions = options;
  const res = {
    statusCode: mockResponseStatusCode,
    on: (event, handler) => {
      if (event === 'data') handler(mockResponseBody);
      if (event === 'end') handler();
    },
  };
  if (!mockRequestError) callback(res);
  return {
    on: (event, handler) => {
      if (event === 'error' && mockRequestError) handler(mockRequestError);
    },
    write: jest.fn(),
    end: jest.fn(),
  };
}

jest.mock('https', () => ({ request: (opts, cb) => mockHttpsRequest(opts, cb) }));

describe('webhookNotifier', () => {
  beforeEach(() => {
    mockRequestOptions = {};
    mockResponseStatusCode = 200;
    mockResponseBody = 'OK';
    mockRequestError = null;
  });

  it('throws if no webhookUrl is provided', () => {
    expect(() => webhookNotifier()).toThrow('webhookNotifier requires a webhookUrl');
  });

  it('sends a POST request to the given URL', async () => {
    const notify = webhookNotifier('https://example.com/hook');
    await notify('test message');
    expect(mockRequestOptions.method).toBe('POST');
    expect(mockRequestOptions.hostname).toBe('example.com');
    expect(mockRequestOptions.path).toBe('/hook');
  });

  it('includes message and timestamp in default payload', async () => {
    const notify = webhookNotifier('https://example.com/hook');
    const result = await notify('hello world');
    expect(result.statusCode).toBe(200);
  });

  it('uses custom formatPayload when provided', async () => {
    const formatPayload = jest.fn((msg) => ({ custom: msg }));
    const notify = webhookNotifier('https://example.com/hook', { formatPayload });
    await notify('custom message');
    expect(formatPayload).toHaveBeenCalledWith('custom message', {});
  });

  it('merges custom headers into the request', async () => {
    const notify = webhookNotifier('https://example.com/hook', {
      headers: { Authorization: 'Bearer token123' },
    });
    await notify('secure message');
    expect(mockRequestOptions.headers['Authorization']).toBe('Bearer token123');
  });

  it('rejects on non-2xx status code', async () => {
    mockResponseStatusCode = 500;
    mockResponseBody = 'Internal Server Error';
    const notify = webhookNotifier('https://example.com/hook');
    await expect(notify('fail')).rejects.toThrow('Webhook request failed with status 500');
  });

  it('rejects on request error', async () => {
    mockRequestError = new Error('network failure');
    const notify = webhookNotifier('https://example.com/hook');
    await expect(notify('fail')).rejects.toThrow('network failure');
  });
});

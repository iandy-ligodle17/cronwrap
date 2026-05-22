const { smsNotifier } = require('./sms');

function mockHttpsRequest(statusCode, responseData) {
  return jest.fn((options, callback) => {
    const res = {
      statusCode,
      on: jest.fn((event, handler) => {
        if (event === 'data') handler(JSON.stringify(responseData));
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

describe('smsNotifier', () => {
  const validConfig = {
    accountSid: 'ACtest123',
    authToken: 'auth_token_123',
    from: '+15551234567',
    to: '+15557654321',
  };

  it('throws if required options are missing', () => {
    expect(() => smsNotifier({})).toThrow(
      'smsNotifier requires accountSid, authToken, from, and to'
    );
  });

  it('throws if any required option is missing', () => {
    expect(() => smsNotifier({ accountSid: 'x', authToken: 'y', from: 'z' })).toThrow();
  });

  it('returns a function when valid options are provided', () => {
    const notify = smsNotifier(validConfig);
    expect(typeof notify).toBe('function');
  });

  it('sends an SMS and resolves on success', async () => {
    const https = require('https');
    const mockRequest = mockHttpsRequest(201, { sid: 'SM123', status: 'queued' });
    jest.spyOn(https, 'request').mockImplementation(mockRequest);

    const notify = smsNotifier(validConfig);
    const result = await notify('Cron job failed!');

    expect(result).toEqual({ sid: 'SM123', status: 'queued' });
    expect(https.request).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: 'api.twilio.com',
        method: 'POST',
      }),
      expect.any(Function)
    );

    jest.restoreAllMocks();
  });

  it('rejects on non-2xx status code', async () => {
    const https = require('https');
    const mockRequest = mockHttpsRequest(400, { message: 'Bad Request' });
    jest.spyOn(https, 'request').mockImplementation(mockRequest);

    const notify = smsNotifier(validConfig);
    await expect(notify('Test message')).rejects.toThrow('Twilio API error: 400');

    jest.restoreAllMocks();
  });
});

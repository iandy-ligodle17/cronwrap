const { snsNotifier } = require('./sns');

function mockHttpsRequest(statusCode = 200, responseBody = '<PublishResponse><PublishResult><MessageId>abc123</MessageId></PublishResult></PublishResponse>') {
  const https = require('https');
  const { EventEmitter } = require('events');

  const mockRes = new EventEmitter();
  mockRes.statusCode = statusCode;

  const mockReq = new EventEmitter();
  mockReq.write = jest.fn();
  mockReq.end = jest.fn(() => {
    mockRes.emit('data', responseBody);
    mockRes.emit('end');
  });

  jest.spyOn(https, 'request').mockImplementation((options, callback) => {
    callback(mockRes);
    return mockReq;
  });

  return { mockReq, mockRes };
}

describe('snsNotifier', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws if topicArn is missing', () => {
    expect(() => snsNotifier({ region: 'us-east-1', accessKeyId: 'key', secretAccessKey: 'secret' }))
      .toThrow('topicArn is required');
  });

  it('throws if region is missing', () => {
    expect(() => snsNotifier({ topicArn: 'arn:aws:sns:us-east-1:123:test', accessKeyId: 'key', secretAccessKey: 'secret' }))
      .toThrow('region is required');
  });

  it('throws if accessKeyId is missing', () => {
    expect(() => snsNotifier({ topicArn: 'arn:aws:sns:us-east-1:123:test', region: 'us-east-1', secretAccessKey: 'secret' }))
      .toThrow('accessKeyId is required');
  });

  it('throws if secretAccessKey is missing', () => {
    expect(() => snsNotifier({ topicArn: 'arn:aws:sns:us-east-1:123:test', region: 'us-east-1', accessKeyId: 'key' }))
      .toThrow('secretAccessKey is required');
  });

  it('sends a message to SNS and resolves on success', async () => {
    mockHttpsRequest(200);
    const notify = snsNotifier({
      topicArn: 'arn:aws:sns:us-east-1:123456789:my-topic',
      region: 'us-east-1',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    });
    await expect(notify('cron job failed')).resolves.toBeDefined();
  });

  it('includes subject when provided', async () => {
    const https = require('https');
    mockHttpsRequest(200);
    const notify = snsNotifier({
      topicArn: 'arn:aws:sns:us-east-1:123456789:my-topic',
      region: 'us-east-1',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      subject: 'Cron Alert',
    });
    await notify('cron job failed');
    const writtenBody = https.request.mock.calls[0];
    expect(writtenBody).toBeDefined();
  });

  it('rejects on non-2xx response', async () => {
    mockHttpsRequest(500, 'Internal Server Error');
    const notify = snsNotifier({
      topicArn: 'arn:aws:sns:us-east-1:123456789:my-topic',
      region: 'us-east-1',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    });
    await expect(notify('cron job failed')).rejects.toThrow('SNS request failed with status 500');
  });
});

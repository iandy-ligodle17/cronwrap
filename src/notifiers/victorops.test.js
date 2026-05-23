'use strict';

const { EventEmitter } = require('events');

// Mock https before requiring the module
const https = require('https');
jest.mock('https');

const { victoropsNotifier } = require('./victorops');

function mockHttpsRequest(statusCode, responseBody) {
  const res = new EventEmitter();
  res.statusCode = statusCode;

  const req = new EventEmitter();
  req.write = jest.fn();
  req.end = jest.fn(() => {
    res.emit('data', responseBody);
    res.emit('end');
  });

  https.request.mockImplementation((options, callback) => {
    callback(res);
    return req;
  });
}

describe('victoropsNotifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects if restEndpointUrl is missing', async () => {
    await expect(
      victoropsNotifier({ entityDisplayName: 'Test', stateMessage: 'Failed' })
    ).rejects.toThrow('restEndpointUrl is required');
  });

  it('rejects if entityDisplayName is missing', async () => {
    await expect(
      victoropsNotifier({ restEndpointUrl: 'https://alert.victorops.com/integrations/123', stateMessage: 'Failed' })
    ).rejects.toThrow('entityDisplayName is required');
  });

  it('rejects if stateMessage is missing', async () => {
    await expect(
      victoropsNotifier({ restEndpointUrl: 'https://alert.victorops.com/integrations/123', entityDisplayName: 'Test' })
    ).rejects.toThrow('stateMessage is required');
  });

  it('resolves on successful request', async () => {
    mockHttpsRequest(200, 'OK');
    await expect(
      victoropsNotifier({
        restEndpointUrl: 'https://alert.victorops.com/integrations/123',
        entityDisplayName: 'Cron Job Failed',
        stateMessage: 'The nightly backup cron job failed.',
      })
    ).resolves.toBe('OK');
    expect(https.request).toHaveBeenCalledTimes(1);
  });

  it('sends CRITICAL message type by default', async () => {
    mockHttpsRequest(200, 'OK');
    await victoropsNotifier({
      restEndpointUrl: 'https://alert.victorops.com/integrations/123',
      entityDisplayName: 'Cron Job Failed',
      stateMessage: 'Something went wrong.',
    });
    const writtenPayload = JSON.parse(https.request.mock.results[0].value.write.mock.calls[0][0]);
    expect(writtenPayload.message_type).toBe('CRITICAL');
    expect(writtenPayload.monitoring_tool).toBe('cronwrap');
  });

  it('rejects on non-2xx status code', async () => {
    mockHttpsRequest(500, 'Internal Server Error');
    await expect(
      victoropsNotifier({
        restEndpointUrl: 'https://alert.victorops.com/integrations/123',
        entityDisplayName: 'Cron Job Failed',
        stateMessage: 'Something went wrong.',
      })
    ).rejects.toThrow('status 500');
  });
});

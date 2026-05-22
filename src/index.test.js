'use strict';

const cronwrap = require('./index');

describe('cronwrap', () => {
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    };
  });

  it('throws if first argument is not a function', () => {
    expect(() => cronwrap('not a function')).toThrow(TypeError);
    expect(() => cronwrap(null)).toThrow(TypeError);
  });

  it('returns a function', () => {
    const wrapped = cronwrap(async () => {}, { logger: mockLogger });
    expect(typeof wrapped).toBe('function');
  });

  it('logs start and completion on success', async () => {
    const wrapped = cronwrap(async () => 'result', { name: 'myJob', logger: mockLogger });
    await wrapped();

    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('Starting job: myJob'));
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('completed'));
  });

  it('calls onSuccess with duration on success', async () => {
    const onSuccess = jest.fn();
    const wrapped = cronwrap(async () => {}, { onSuccess, logger: mockLogger });
    await wrapped();

    expect(onSuccess).toHaveBeenCalledWith(expect.any(Number));
  });

  it('logs error and calls onFailure on failure', async () => {
    const onFailure = jest.fn();
    const error = new Error('boom');
    const wrapped = cronwrap(async () => { throw error; }, { name: 'failJob', onFailure, logger: mockLogger });

    await expect(wrapped()).rejects.toThrow('boom');
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('failJob'));
    expect(onFailure).toHaveBeenCalledWith(error);
  });

  it('re-throws the original error after failure', async () => {
    const wrapped = cronwrap(async () => { throw new Error('original'); }, { logger: mockLogger });
    await expect(wrapped()).rejects.toThrow('original');
  });

  it('passes arguments through to the wrapped function', async () => {
    const inner = jest.fn(async (a, b) => a + b);
    const wrapped = cronwrap(inner, { logger: mockLogger });
    const result = await wrapped(2, 3);

    expect(inner).toHaveBeenCalledWith(2, 3);
    expect(result).toBe(5);
  });
});

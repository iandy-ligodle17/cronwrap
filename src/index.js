'use strict';

/**
 * Wraps a cron job function with logging and failure alert support.
 *
 * @param {Function} fn - The async function to wrap
 * @param {Object} options - Configuration options
 * @param {string} [options.name='job'] - Name of the job for logging
 * @param {Function} [options.onSuccess] - Called with duration (ms) on success
 * @param {Function} [options.onFailure] - Called with error on failure
 * @param {Function} [options.logger] - Custom logger (defaults to console)
 * @returns {Function} Wrapped async function
 */
function cronwrap(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('cronwrap: first argument must be a function');
  }

  const {
    name = 'job',
    onSuccess = null,
    onFailure = null,
    logger = console,
  } = options;

  return async function wrappedJob(...args) {
    const start = Date.now();
    logger.log(`[cronwrap] Starting job: ${name}`);

    try {
      const result = await fn(...args);
      const duration = Date.now() - start;

      logger.log(`[cronwrap] Job "${name}" completed in ${duration}ms`);

      if (typeof onSuccess === 'function') {
        await onSuccess(duration);
      }

      return result;
    } catch (err) {
      const duration = Date.now() - start;

      logger.error(`[cronwrap] Job "${name}" failed after ${duration}ms: ${err.message}`);

      if (typeof onFailure === 'function') {
        await onFailure(err);
      }

      throw err;
    }
  };
}

module.exports = cronwrap;

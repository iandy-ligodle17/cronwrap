/**
 * Notifiers index — convenience re-exports for all built-in notifiers.
 *
 * Usage:
 *   const { slack, email } = require('cronwrap/src/notifiers');
 */

const slack = require('./slack');
const email = require('./email');

module.exports = { slack, email };

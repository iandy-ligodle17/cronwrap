'use strict';

const https = require('https');

/**
 * Send an alert to VictorOps (Splunk On-Call) via REST endpoint
 * @param {Object} options
 * @param {string} options.restEndpointUrl - Full VictorOps REST endpoint URL
 * @param {string} options.messageType - CRITICAL, WARNING, ACKNOWLEDGEMENT, INFO, RECOVERY
 * @param {string} options.entityDisplayName - Display name for the alert
 * @param {string} options.stateMessage - Detailed message body
 * @returns {Promise}
 */
function victoropsNotifier(options) {
  const {
    restEndpointUrl,
    messageType = 'CRITICAL',
    entityDisplayName,
    stateMessage,
  } = options;

  if (!restEndpointUrl) {
    return Promise.reject(new Error('victoropsNotifier: restEndpointUrl is required'));
  }

  if (!entityDisplayName) {
    return Promise.reject(new Error('victoropsNotifier: entityDisplayName is required'));
  }

  if (!stateMessage) {
    return Promise.reject(new Error('victoropsNotifier: stateMessage is required'));
  }

  const payload = JSON.stringify({
    message_type: messageType,
    entity_display_name: entityDisplayName,
    state_message: stateMessage,
    monitoring_tool: 'cronwrap',
  });

  const url = new URL(restEndpointUrl);

  const reqOptions = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`victoropsNotifier: request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { victoropsNotifier };

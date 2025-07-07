// Logging Middleware: routes all config from environment variables for both backend and frontend

// Prefer REACT_APP_ variables in browser, fallback to backend variables in Node.js
function getApiUrl() {
  return process.env.REACT_APP_LOG_API_URL || process.env.LOG_API_URL;
}
function getToken() {
  return process.env.REACT_APP_LOG_API_TOKEN || process.env.LOG_API_TOKEN;
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Log function for both backend and frontend
 * @param {string} stack - 'backend' or 'frontend'
 * @param {string} level - 'debug', 'info', 'warn', 'error', 'fatal'
 * @param {string} pkg - package name (see allowed list)
 * @param {string} message - log message
 * @returns {Promise<object>} - API response
 */
async function Log(stack, level, pkg, message) {
  const STACKS = ['backend', 'frontend'];
  const LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
  const PACKAGES = [
    'cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service',
    'api', 'component', 'hook', 'page', 'state', 'style',
    'auth', 'config', 'middleware', 'utils'
  ];
  if (!STACKS.includes(stack)) throw new Error('Invalid stack');
  if (!LEVELS.includes(level)) throw new Error('Invalid level');
  if (!PACKAGES.includes(pkg)) throw new Error('Invalid package');
  if (typeof message !== 'string' || !message.trim()) throw new Error('Invalid message');

  const token = getToken();
  const LOG_API_URL = getApiUrl();
  if (!token) throw new Error('Missing LOG_API_TOKEN');
  if (!LOG_API_URL) throw new Error('Missing LOG_API_URL');
  const body = { stack, level, package: pkg, message };

  if (isBrowser()) {
    const res = await fetch(LOG_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let data = {};
      try { data = await res.json(); } catch {}
      throw new Error('Failed to log: ' + (data.message || res.statusText));
    }
    return await res.json();
  } else {
    const axios = require('axios');
    try {
      const res = await axios.post(LOG_API_URL, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    } catch (err) {
      throw new Error('Failed to log: ' + (err.response?.data?.message || err.message));
    }
  }
}

module.exports = Log; 
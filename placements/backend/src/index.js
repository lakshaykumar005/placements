require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
console.log("Starting backend...");
const express = require('express');
const cors = require('cors');
const Log = require('logging-middleware');
const { nanoid } = require('nanoid');
// const loggingMiddleware = require('../../logging-middleware'); // To be implemented and imported

const app = express();
app.use(cors());
app.use(express.json());

// TODO: Integrate logging middleware here (mandatory)
// app.use(loggingMiddleware());

const BASE_URL = process.env.BASE_URL || 'http://localhost:5050/shorturls';
const DEFAULT_VALIDITY = 30; // minutes
const SHORTCODE_LENGTH = 6;
const SHORTCODE_REGEX = /^[a-zA-Z0-9]{4,16}$/;

// In-memory storage
const urlMap = {}; // shortcode -> { url, expiry, createdAt, clicks: [], validity }

// Helper: Generate unique shortcode
function generateShortcode() {
  let code;
  do {
    code = nanoid(SHORTCODE_LENGTH);
  } while (urlMap[code]);
  return code;
}

// Helper: Validate URL
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

app.get('/', async (req, res) => {
  try {
    await Log('backend', 'info', 'middleware', 'Root endpoint accessed');
  } catch (e) {}
  res.json({ message: 'URL Shortener Backend is running.' });
});

// POST /shorturls - Create short URL
app.post('/shorturls', async (req, res) => {
  const { url, validity, shortcode } = req.body;
  try {
    await Log('backend', 'info', 'controller', 'POST /shorturls called');
    // Validate url
    if (!url || !isValidUrl(url)) {
      await Log('backend', 'error', 'controller', 'Invalid URL');
      return res.status(400).json({ error: 'Invalid URL' });
    }
    // Validate validity
    let validMins = DEFAULT_VALIDITY;
    if (validity !== undefined) {
      if (!Number.isInteger(validity) || validity <= 0) {
        await Log('backend', 'error', 'controller', 'Invalid validity');
        return res.status(400).json({ error: 'Validity must be a positive integer (minutes)' });
      }
      validMins = validity;
    }
    // Validate/generate shortcode
    let code = shortcode;
    if (code) {
      if (!SHORTCODE_REGEX.test(code)) {
        await Log('backend', 'error', 'controller', 'Invalid shortcode format');
        return res.status(400).json({ error: 'Shortcode must be alphanumeric, 4-16 chars' });
      }
      if (urlMap[code]) {
        await Log('backend', 'error', 'controller', 'Shortcode already exists');
        return res.status(409).json({ error: 'Shortcode already exists' });
      }
    } else {
      code = generateShortcode();
    }
    // Store
    const now = new Date();
    const expiry = new Date(now.getTime() + validMins * 60000);
    urlMap[code] = {
      url,
      createdAt: now.toISOString(),
      expiry: expiry.toISOString(),
      validity: validMins,
      clicks: []
    };
    await Log('backend', 'info', 'controller', `Short URL created: ${code}`);
    return res.status(201).json({
      shortLink: `${BASE_URL}/${code}`,
      expiry: expiry.toISOString()
    });
  } catch (err) {
    await Log('backend', 'error', 'controller', `Internal error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /shorturls/:shortcode - Get stats
app.get('/shorturls/:shortcode', async (req, res) => {
  const { shortcode } = req.params;
  try {
    await Log('backend', 'info', 'controller', `GET /shorturls/${shortcode} called`);
    const entry = urlMap[shortcode];
    if (!entry) {
      await Log('backend', 'warn', 'controller', 'Shortcode not found');
      return res.status(404).json({ error: 'Shortcode not found' });
    }
    // Stats
    return res.json({
      url: entry.url,
      createdAt: entry.createdAt,
      expiry: entry.expiry,
      validity: entry.validity,
      clickCount: entry.clicks.length,
      clicks: entry.clicks
    });
  } catch (err) {
    await Log('backend', 'error', 'controller', `Internal error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /shorturls/:shortcode/redirect - Redirect
app.get('/shorturls/:shortcode/redirect', async (req, res) => {
  const { shortcode } = req.params;
  try {
    await Log('backend', 'info', 'controller', `Redirect for ${shortcode} called`);
    const entry = urlMap[shortcode];
    if (!entry) {
      await Log('backend', 'warn', 'controller', 'Shortcode not found');
      return res.status(404).json({ error: 'Shortcode not found' });
    }
    const now = new Date();
    if (now > new Date(entry.expiry)) {
      await Log('backend', 'warn', 'controller', 'Shortcode expired');
      return res.status(410).json({ error: 'Shortcode expired' });
    }
    // Log click
    const click = {
      timestamp: now.toISOString(),
      referrer: req.get('referer') || null,
      geo: req.ip // For demo, just IP; real geo would use a geo-IP service
    };
    entry.clicks.push(click);
    await Log('backend', 'info', 'controller', `Redirected to ${entry.url}`);
    return res.redirect(entry.url);
  } catch (err) {
    await Log('backend', 'error', 'controller', `Internal error: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  Log('backend', 'info', 'middleware', `Server running on port ${PORT}`).catch(() => {});
});

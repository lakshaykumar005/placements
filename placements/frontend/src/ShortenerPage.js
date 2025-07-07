import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Grid, Paper, Alert } from '@mui/material';
import Log from 'logging-middleware';

const MAX_URLS = 5;
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/shorturls';

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

const initialInputs = Array(MAX_URLS).fill().map(() => ({ url: '', validity: '', shortcode: '' }));

function ShortenerPage() {
  const [inputs, setInputs] = useState(initialInputs);
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (idx, field, value) => {
    const newInputs = [...inputs];
    newInputs[idx][field] = value;
    setInputs(newInputs);
  };

  const validate = (input) => {
    if (!input.url) return 'URL is required';
    if (!isValidUrl(input.url)) return 'Invalid URL format';
    if (input.validity && (!/^[0-9]+$/.test(input.validity) || parseInt(input.validity) <= 0)) return 'Validity must be a positive integer';
    if (input.shortcode && !/^[a-zA-Z0-9]{4,16}$/.test(input.shortcode)) return 'Shortcode must be alphanumeric, 4-16 chars';
    return null;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors([]);
    setResults([]);
    const errs = inputs.map(validate);
    if (errs.some(e => e)) {
      setErrors(errs);
      setLoading(false);
      await Log('frontend', 'error', 'component', 'Validation error on URL shortener form');
      return;
    }
    try {
      await Log('frontend', 'info', 'component', 'Submitting URL shortener form');
      const resArr = await Promise.all(inputs.map(async (input) => {
        if (!input.url) return null;
        const body = {
          url: input.url,
          ...(input.validity && { validity: parseInt(input.validity) }),
          ...(input.shortcode && { shortcode: input.shortcode })
        };
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (res.ok) {
          await Log('frontend', 'info', 'component', `Shortened URL created: ${data.shortLink}`);
        } else {
          await Log('frontend', 'warn', 'component', `Shorten URL error: ${data.error}`);
        }
        return res.ok ? data : { error: data.error };
      }));
      setResults(resArr);
    } catch (e) {
      setErrors(['Network error']);
      await Log('frontend', 'fatal', 'component', 'Network error on URL shortener form');
    }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Shorten up to 5 URLs</Typography>
      <Grid container spacing={2}>
        {inputs.map((input, idx) => (
          <Grid item xs={12} md={6} key={idx}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">URL #{idx + 1}</Typography>
              <TextField
                label="Long URL"
                value={input.url}
                onChange={e => handleChange(idx, 'url', e.target.value)}
                fullWidth
                margin="normal"
                error={!!errors[idx] && errors[idx].includes('URL')}
                helperText={errors[idx] && errors[idx].includes('URL') ? errors[idx] : ''}
              />
              <TextField
                label="Validity (minutes, optional)"
                value={input.validity}
                onChange={e => handleChange(idx, 'validity', e.target.value)}
                fullWidth
                margin="normal"
                error={!!errors[idx] && errors[idx].includes('Validity')}
                helperText={errors[idx] && errors[idx].includes('Validity') ? errors[idx] : ''}
              />
              <TextField
                label="Shortcode (optional)"
                value={input.shortcode}
                onChange={e => handleChange(idx, 'shortcode', e.target.value)}
                fullWidth
                margin="normal"
                error={!!errors[idx] && errors[idx].includes('Shortcode')}
                helperText={errors[idx] && errors[idx].includes('Shortcode') ? errors[idx] : ''}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ mt: 2 }}>
        Shorten URLs
      </Button>
      <Box sx={{ mt: 4 }}>
        {results.map((res, idx) => (
          res && (
            <Alert key={idx} severity={res.error ? 'error' : 'success'} sx={{ mb: 2 }}>
              {res.error ? res.error : (
                <span>
                  <strong>Shortened URL:</strong> <a href={res.shortLink} target="_blank" rel="noopener noreferrer">{res.shortLink}</a><br/>
                  <strong>Expiry:</strong> {res.expiry}
                </span>
              )}
            </Alert>
          )
        ))}
      </Box>
    </Box>
  );
}

export default ShortenerPage; 
import React, { useState } from 'react';
import { Box, Typography, Button, Paper, List, ListItem, ListItemText, Divider, Alert } from '@mui/material';
import Log from 'logging-middleware';

const API_URL = process.env.REACT_APP_API_URL;

function StatsPage() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For demo: fetch all stats for codes in sessionStorage
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      await Log('frontend', 'info', 'component', 'Fetching stats for shortened URLs');
      const codes = JSON.parse(sessionStorage.getItem('shortcodes') || '[]');
      if (!API_URL) throw new Error('API URL is not set.');
      const arr = await Promise.all(codes.map(async (code) => {
        try {
          const res = await fetch(`${API_URL}/${code}`);
          if (res.ok) {
            await Log('frontend', 'info', 'component', `Fetched stats for shortcode: ${code}`);
            return await res.json();
          } else {
            await Log('frontend', 'warn', 'component', `Failed to fetch stats for shortcode: ${code}`);
            return null;
          }
        } catch (err) {
          await Log('frontend', 'fatal', 'component', `Network error for shortcode: ${code}`);
          return null;
        }
      }));
      setStats(arr.filter(Boolean));
    } catch (e) {
      let msg = e.message || 'Failed to fetch stats.';
      if (msg.includes('LOG_API_TOKEN')) {
        msg = 'Logging is not configured. Please check your environment variables.';
      }
      setError(msg);
      try { await Log('frontend', 'fatal', 'component', msg); } catch {}
    }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Shortened URL Statistics</Typography>
      <Button variant="contained" onClick={fetchStats} disabled={loading} sx={{ mb: 2 }}>
        Fetch Stats
      </Button>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {stats.map((stat, idx) => (
        <Paper key={idx} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1"><a href={stat.url} target="_blank" rel="noopener noreferrer">{stat.url}</a></Typography>
          <Typography>Created: {stat.createdAt}</Typography>
          <Typography>Expiry: {stat.expiry}</Typography>
          <Typography>Clicks: {stat.clickCount}</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2">Click Details:</Typography>
          <List>
            {stat.clicks.map((click, i) => (
              <ListItem key={i}>
                <ListItemText
                  primary={`Time: ${click.timestamp}`}
                  secondary={`Referrer: ${click.referrer || 'N/A'}, Geo: ${click.geo || 'N/A'}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      ))}
    </Box>
  );
}

export default StatsPage; 
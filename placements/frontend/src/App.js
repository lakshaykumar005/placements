import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Tabs, Tab, Container, Box } from '@mui/material';
import ShortenerPage from './ShortenerPage';
import StatsPage from './StatsPage';

function App() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            URL Shortener
          </Typography>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit" indicatorColor="secondary">
            <Tab label="Shorten URLs" />
            <Tab label="Statistics" />
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        {tab === 0 && <ShortenerPage />}
        {tab === 1 && <StatsPage />}
      </Container>
    </Box>
  );
}

export default App;

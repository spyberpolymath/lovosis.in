const express = require('express');
const { connectDB } = require('./src/lib/db');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8082;

// Load SSL certificates
const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/lovosis.in/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/lovosis.in/fullchain.pem')
};

// Middleware
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Connect to the database first
connectDB()
  .then(() => {
    https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 HTTPS Server running at https://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

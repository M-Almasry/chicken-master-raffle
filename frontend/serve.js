const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PM2_SERVE_PORT || 8555;

const distPath = path.join(__dirname, 'dist');

// Middleware for logging
app.use((req, res, next) => {
  console.log(`[Frontend] ${req.method} ${req.url}`);
  next();
});

// Admin Route (SPA) rewrite
app.get(['/admin', '/admin/*'], (req, res) => {
  res.sendFile(path.join(distPath, 'admin.html'));
});

// Static common files
app.use(express.static(distPath));

// Handle assets nested in /admin/
app.use('/admin', express.static(distPath));

// Fallback to index.html for unknown routes (optional, or just 404)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend is running on http://localhost:${PORT}`);
});

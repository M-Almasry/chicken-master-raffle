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

// Static common files (MUST come before rewrites to avoid catching assets)
app.use(express.static(distPath));

// Admin Route (SPA) rewrite
app.get(['/admin', '/admin/*'], (req, res) => {
  const adminHtmlPath = path.join(distPath, 'admin.html');
  console.log(`[Frontend] Serving Admin SPA: ${req.url} -> admin.html`);
  res.sendFile(adminHtmlPath);
});

// Handle assets nested in /admin/ (if any relative paths remain)
app.use('/admin', express.static(distPath));

// Fallback to index.html for unknown routes (Main SPA)
app.get('*', (req, res) => {
  console.log(`[Frontend] Fallback to index.html: ${req.url}`);
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend is running on http://localhost:${PORT}`);
});

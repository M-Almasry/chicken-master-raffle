require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1); // ✅ Trust Render Proxy to get real User IP
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*"],
      connectSrc: ["'self'", "http://localhost:3000", "https://*"],
    },
  },
}));
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.netlify.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: {
      ar: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً',
      en: 'Too many requests, please try again later'
    }
  }
});

app.use('/api/', limiter);

// Routes
const registrationsRouter = require('./routes/registrations');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');

app.use('/api/registrations', registrationsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

// Serve static files from frontend
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mister Chicken Raffle API',
    version: '1.0.0',
    endpoints: {
      registrations: '/api/registrations',
      orders: '/api/orders',
      admin: '/api/admin'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: {
      ar: 'المسار غير موجود',
      en: 'Endpoint not found'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: {
      ar: 'حدث خطأ في السيرفر',
      en: 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Server is running on port ${PORT}
📊 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API: http://localhost:${PORT}
📖 Health: http://localhost:${PORT}/health
  `);
});

module.exports = app;

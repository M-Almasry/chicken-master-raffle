require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('./db/connection');

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
      'http://127.0.0.1:5500',
      'http://localhost:58767',
      'http://127.0.0.1:58767',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://chickenmasterps.com',
      'https://www.chickenmasterps.com'
    ];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const isLocalhost = origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin.endsWith('.local');

    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.netlify.app') || isLocalhost) {
      callback(null, true);
    } else {
      console.error('❌ CORS blocked origin:', origin);
      // In development, maybe just allow it or return a more descriptive error
      callback(new Error(`Not allowed by CORS: ${origin}`));
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

app.use('/api/', (req, res, next) => {
  if (req.path === '/shop/status') {
    return next(); // Bypass rate limiter for status polling
  }
  limiter(req, res, next);
});

// Routes
const registrationsRouter = require('./routes/registrations');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');
const shopRouter = require('./routes/shop');
const reviewsRouter = require('./routes/reviews');

app.use('/api/registrations', registrationsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/shop', shopRouter);
app.use('/api/reviews', reviewsRouter);

// Serve static files from frontend
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));


// Health check endpoint with DB ping
app.get('/health', async (req, res) => {
  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    const dbDuration = Date.now() - dbStart;

    res.json({
      success: true,
      message: 'Server and Database are running',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        latency: `${dbDuration}ms`
      }
    });
  } catch (error) {
    console.error('Health check DB error:', error);
    res.status(503).json({
      success: false,
      message: 'Server is running but Database is unreachable',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
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
  console.error('❌ Global Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const isDev = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    message: {
      ar: 'حدث خطأ في السيرفر',
      en: 'Internal server error'
    },
    ...(isDev && {
      error: err.message,
      details: err.stack?.split('\n')[1] // Just the first line of trace for brevity
    })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 Server is running on port ${PORT}
📊 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API: http://localhost:${PORT}
📖 Health: http://localhost:${PORT}/health
  `);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use.`);
  } else {
    console.error('❌ Server startup error:', error);
  }
  process.exit(1);
});

module.exports = app;

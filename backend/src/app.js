const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const maintenanceMiddleware = require('./middleware/maintenanceMiddleware');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const contactRoutes = require('./routes/contactRoutes');
const couponRoutes = require('./routes/couponRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingRoutes = require('./routes/settingRoutes');
const pincodeRoutes = require('./routes/pincodeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const settingController = require('./controllers/settingController');
const contactController = require('./controllers/contactController');

// --------------------------------------------------
// CREATE EXPRESS APP
// IMPORTANT: This must come BEFORE app.use()
// --------------------------------------------------

const app = express();

// --------------------------------------------------
// SECURITY
// --------------------------------------------------

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

// --------------------------------------------------
// CORS
// --------------------------------------------------

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://karviyam.com',
  'https://www.karviyam.com',
  'http://karviyam.com',
  'http://www.karviyam.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin
      // and allow configured origins.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Keep compatibility with your existing configuration.
      return callback(null, true);
    },
    credentials: true
  })
);

// --------------------------------------------------
// BODY PARSERS
// --------------------------------------------------

app.use(
  express.json({
    limit: '50mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb'
  })
);

// --------------------------------------------------
// LOGGING
// --------------------------------------------------

app.use(morgan('dev'));

// --------------------------------------------------
// STATIC UPLOADS
// --------------------------------------------------

const uploadsDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, {
    recursive: true
  });
}

app.use('/uploads', express.static(uploadsDir));

// --------------------------------------------------
// ROOT ASSETS
// --------------------------------------------------

const rootAssetsDir = path.join(__dirname, '../../assets');

if (fs.existsSync(rootAssetsDir)) {
  app.use('/assets', express.static(rootAssetsDir));
}

// --------------------------------------------------
// MAINTENANCE MODE
// --------------------------------------------------

app.use(maintenanceMiddleware);

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------

app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/customer', customerRoutes);

app.use('/api/products', productRoutes);

app.use('/api/categories', categoryRoutes);

app.use('/api/brands', brandRoutes);

app.use('/api/cart', cartRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/payments', paymentRoutes);

app.use('/api/reviews', reviewRoutes);

app.use('/api/wishlist', wishlistRoutes);

app.use('/api/banners', bannerRoutes);

app.use('/api/contact', contactRoutes);

// Fallback Contact Aliases
app.post('/api/contact-us', contactController.submitContact);
app.post('/api/submit-contact', contactController.submitContact);
app.post('/api/messages/submit', contactController.submitContact);
app.post('/api/customer/contact', contactController.submitContact);

app.use('/api/coupons', couponRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/settings', settingRoutes);

app.get('/api/footer-settings', settingController.getFooterSettings);

app.use('/api/pincodes', pincodeRoutes);

app.use('/api/admin/audit-logs', auditLogRoutes);

app.use('/api/admin', adminRoutes);

// Explicit Help & Support Alias Routes
app.get('/api/admin/contact-messages', contactController.getContactMessages);
app.get('/api/admin/help-support', contactController.getContactMessages);
app.get('/api/admin/help_support', contactController.getContactMessages);
app.get('/api/contact-messages', contactController.getContactMessages);

app.get('/api/admin/contact-messages/:id', contactController.getConversationById);
app.get('/api/admin/help-support/:id', contactController.getConversationById);

app.post('/api/admin/contact-messages/:id/reply', contactController.replyToConversation);
app.post('/api/admin/help-support/:id/reply', contactController.replyToConversation);

app.put('/api/admin/contact-messages/:id/status', contactController.updateMessageStatus);
app.put('/api/admin/help-support/:id/status', contactController.updateMessageStatus);

app.delete('/api/admin/contact-messages/:id', contactController.deleteMessage);
app.delete('/api/admin/help-support/:id', contactController.deleteMessage);

app.use('/api/upload', uploadRoutes);

// --------------------------------------------------
// HEALTH CHECK & MAINTENANCE STATUS
// --------------------------------------------------

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'Karviyam Node.js Express Backend',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/maintenance-status', settingController.getSettings);

// --------------------------------------------------
// FRONTEND STATIC BUILD & CLIENT-SIDE ROUTING
// --------------------------------------------------

const potentialDistDirs = [
  path.join(__dirname, '../../frontend/dist'),
  path.join(__dirname, '../../dist'),
  path.join(__dirname, '../dist'),
  path.join(process.cwd(), 'frontend/dist'),
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), '../frontend/dist'),
  path.join(process.cwd(), '../dist'),
  path.join(process.cwd(), 'public_html/frontend/dist'),
  path.join(process.cwd(), 'public_html/dist'),
  path.join(process.cwd(), 'public_html'),
  path.join(process.cwd(), '../public_html/frontend/dist'),
  path.join(process.cwd(), '../public_html')
];

let frontendDistDir = null;
for (const dir of potentialDistDirs) {
  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
    frontendDistDir = dir;
    break;
  }
}

if (frontendDistDir) {
  console.log(`✅ Serving React Frontend build from: ${frontendDistDir}`);
  app.use(express.static(frontendDistDir));

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
      return res.sendFile(path.join(frontendDistDir, 'index.html'));
    }
    next();
  });
} else {
  // ROOT ROUTE FALLBACK WHEN DIST DOES NOT EXIST
  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'UP',
      message: 'Karviyam Backend API is running',
      health: '/api/health'
    });
  });
}

// --------------------------------------------------
// 404 HANDLER FOR UNMATCHED ROUTES
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    status: 'NOT_FOUND',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// --------------------------------------------------
// CENTRALIZED ERROR HANDLER
// --------------------------------------------------

app.use(errorHandler);

// --------------------------------------------------
// EXPORT APP
// --------------------------------------------------

module.exports = app;
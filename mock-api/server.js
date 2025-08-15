const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const billRoutes = require('./routes/bills');
const restaurantRoutes = require('./routes/restaurants');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8082', 'http://localhost:19006', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.method !== 'GET') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Split Bill Mock API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/users', userRoutes);

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Split Bill Mock API Documentation',
    version: '1.0.0',
    baseUrl: `http://localhost:${PORT}/api`,
    endpoints: {
      auth: {
        'POST /auth/login': 'Login with email and password',
        'POST /auth/register': 'Register new user account',
        'GET /auth/me': 'Get current user profile (requires auth)',
        'PUT /auth/me': 'Update user profile (requires auth)',
        'POST /auth/refresh': 'Refresh JWT token (requires auth)',
        'POST /auth/logout': 'Logout (requires auth)'
      },
      bills: {
        'GET /bills': 'Get user\'s bills with pagination (requires auth)',
        'GET /bills/:billId': 'Get specific bill details (requires auth)',
        'POST /bills': 'Create new bill (requires auth)',
        'PUT /bills/:billId': 'Update bill (requires auth)',
        'DELETE /bills/:billId': 'Delete bill - creator only (requires auth)',
        'POST /bills/:billId/payments': 'Add payment to bill (requires auth)',
        'GET /bills/:billId/activities': 'Get bill activity history (requires auth)'
      },
      restaurants: {
        'GET /restaurants': 'Search restaurants with filters',
        'GET /restaurants/:restaurantId': 'Get restaurant details',
        'GET /restaurants/:restaurantId/menu': 'Get restaurant menu',
        'GET /restaurants/menu/items': 'Search all menu items'
      },
      users: {
        'GET /users/search': 'Search users (requires auth)',
        'GET /users/nearby': 'Get nearby friends (requires auth)',
        'GET /users/friends': 'Get friends list (requires auth)',
        'POST /users/friends/request': 'Send friend request (requires auth)',
        'PUT /users/friends/request/:friendshipId': 'Accept/decline friend request (requires auth)',
        'DELETE /users/friends/:friendshipId': 'Remove friend (requires auth)',
        'GET /users/:userId': 'Get user profile by ID'
      }
    },
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      demoCredentials: {
        email: 'you@example.com',
        password: 'password123'
      }
    },
    sampleData: {
      demoUsers: [
        { id: 1, email: 'you@example.com', name: 'You' },
        { id: 2, email: 'tom@example.com', name: 'Tom' },
        { id: 3, email: 'jessica@example.com', name: 'Jessica' }
      ],
      note: 'All demo users use password: password123'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    availableEndpoints: [
      'GET /health',
      'GET /api/docs',
      'POST /api/auth/login',
      'GET /api/bills',
      'GET /api/restaurants',
      'GET /api/users/search'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Split Bill Mock API Server Started');
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log('\n📋 Demo Login Credentials:');
  console.log('   Email: you@example.com');
  console.log('   Password: password123');
  console.log('\n🔧 Available endpoints:');
  console.log('   • Authentication: /api/auth/*');
  console.log('   • Bills: /api/bills/*');
  console.log('   • Restaurants: /api/restaurants/*');
  console.log('   • Users: /api/users/*');
  console.log('\n✨ Ready to serve your split bill app!');
});

module.exports = app;

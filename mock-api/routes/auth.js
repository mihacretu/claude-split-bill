const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { users } = require('../data/users');
const router = express.Router();

// Mock password for demo users (in real app, these would be hashed)
const DEMO_PASSWORD = 'password123';
const DEMO_PASSWORD_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // For demo purposes, accept the demo password for all users
    const passwordValid = password === DEMO_PASSWORD || await bcrypt.compare(password, DEMO_PASSWORD_HASH);
    
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data without sensitive info
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, username, phone } = req.body;

    // Validation
    if (!email || !password || !name || !username) {
      return res.status(400).json({
        error: 'Email, password, name, and username are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Check if user already exists
    const existingUser = users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() || 
      u.username.toLowerCase() === username.toLowerCase()
    );

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email or username already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Math.max(...users.map(u => u.id)) + 1,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      name,
      avatar: `https://images.unsplash.com/photo-${Date.now()}?w=60&h=60&fit=crop&crop=face`,
      phone: phone || null,
      preferences: {
        currency: "USD",
        notifications: {
          billReminders: true,
          paymentReceived: true,
          friendRequests: true
        },
        privacy: {
          shareLocation: true,
          showInNearby: true
        }
      },
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    // Add to users array (in real app, save to database)
    users.push(newUser);

    // Generate JWT token
    const token = generateToken(newUser);

    // Return user data
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Update user profile
router.put('/me', authenticateToken, (req, res) => {
  try {
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const { name, phone, preferences } = req.body;
    
    // Update allowed fields
    if (name) users[userIndex].name = name;
    if (phone !== undefined) users[userIndex].phone = phone;
    if (preferences) {
      users[userIndex].preferences = {
        ...users[userIndex].preferences,
        ...preferences
      };
    }

    const { password: _, ...userWithoutPassword } = users[userIndex];

    res.json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const newToken = generateToken(user);

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Logout (in a real app, you might want to blacklist the token)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;

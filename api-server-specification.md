# Claude Split Bill App - API Server Specification

## Overview

This document outlines the REST API specification for the Claude Split Bill App backend server. The API provides endpoints for managing hangouts, bills, item assignments, payments, and user relationships.

## Technology Stack

- **Framework**: Node.js with Express.js (recommended) or FastAPI (Python)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth (JWT tokens)
- **Validation**: Joi/Zod for request validation
- **Documentation**: Swagger/OpenAPI

## Base Configuration

```javascript
// Server Configuration
const config = {
  port: process.env.PORT || 3001,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  corsOrigin: process.env.CORS_ORIGIN || "*"
};
```

## Authentication

All endpoints (except public ones) require authentication via Supabase JWT token:

```
Authorization: Bearer <supabase_jwt_token>
```

## API Endpoints

### 🔐 Authentication & Users

#### GET /api/auth/me
Get current user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "avatar_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/auth/profile
Update user profile.

**Request Body:**
```json
{
  "username": "johndoe",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "avatar_url": "https://..."
}
```

#### GET /api/users/search
Search for users to add as friends.

**Query Parameters:**
- `q` (string): Search query (name, username, email)
- `limit` (number): Results limit (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "janedoe",
      "full_name": "Jane Doe",
      "avatar_url": "https://..."
    }
  ]
}
```

### 👥 Friends Management

#### GET /api/friends
Get user's friends list.

**Query Parameters:**
- `status` (string): 'pending', 'accepted', 'declined' (default: 'accepted')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "friend": {
        "id": "uuid",
        "username": "janedoe",
        "full_name": "Jane Doe",
        "avatar_url": "https://..."
      },
      "status": "accepted",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/friends/request
Send friend request.

**Request Body:**
```json
{
  "user_id": "uuid"
}
```

#### PUT /api/friends/:friendshipId
Respond to friend request.

**Request Body:**
```json
{
  "action": "accept" // or "decline"
}
```

### 🎉 Hangouts Management

#### GET /api/hangouts
Get user's hangouts.

**Query Parameters:**
- `status` (string): 'active', 'completed', 'cancelled'
- `limit` (number): Results limit (default: 20)
- `offset` (number): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Dinner at Steak House",
      "location_name": "The Steak House",
      "location_address": "123 Main St",
      "hangout_date": "2024-01-01T19:00:00Z",
      "status": "active",
      "created_by": {
        "id": "uuid",
        "full_name": "John Doe",
        "avatar_url": "https://..."
      },
      "participants_count": 4,
      "has_bill": true,
      "created_at": "2024-01-01T18:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

#### POST /api/hangouts
Create new hangout.

**Request Body:**
```json
{
  "title": "Dinner at Steak House",
  "location_name": "The Steak House",
  "location_address": "123 Main St",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "hangout_date": "2024-01-01T19:00:00Z"
}
```

#### GET /api/hangouts/:hangoutId
Get specific hangout details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Dinner at Steak House",
    "location_name": "The Steak House",
    "location_address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "hangout_date": "2024-01-01T19:00:00Z",
    "status": "active",
    "created_by": {
      "id": "uuid",
      "full_name": "John Doe",
      "avatar_url": "https://..."
    },
    "participants": [
      {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "full_name": "Jane Doe",
          "avatar_url": "https://..."
        },
        "participation_status": "active",
        "joined_at": "2024-01-01T18:00:00Z"
      }
    ],
    "bill": {
      "id": "uuid",
      "title": "Dinner Bill",
      "total_amount": 125.50,
      "status": "active"
    }
  }
}
```

#### PUT /api/hangouts/:hangoutId
Update hangout (only by creator).

**Request Body:**
```json
{
  "title": "Updated Dinner",
  "location_name": "New Restaurant",
  "status": "completed"
}
```

#### POST /api/hangouts/:hangoutId/participants
Add participant to hangout.

**Request Body:**
```json
{
  "user_id": "uuid"
}
```

#### DELETE /api/hangouts/:hangoutId/participants/:userId
Remove participant from hangout.

### 💰 Bills Management

#### GET /api/hangouts/:hangoutId/bill
Get bill for specific hangout.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Dinner Bill",
    "description": "Great dinner with friends",
    "subtotal": 100.00,
    "tax_amount": 8.50,
    "tip_amount": 17.00,
    "total_amount": 125.50,
    "status": "active",
    "created_by": {
      "id": "uuid",
      "full_name": "John Doe"
    },
    "paid_by": {
      "id": "uuid",
      "full_name": "John Doe"
    },
    "bill_date": "2024-01-01T20:00:00Z",
    "items": [
      {
        "id": "uuid",
        "item_name": "Grilled Salmon",
        "item_price": 22.00,
        "total_quantity": 2,
        "total_amount": 44.00,
        "image_url": "https://...",
        "assignments": [
          {
            "user_id": "uuid",
            "user_name": "Jane Doe",
            "quantity": 1,
            "assigned_amount": 22.00
          }
        ]
      }
    ],
    "participant_balances": [
      {
        "user_id": "uuid",
        "user_name": "Jane Doe",
        "total_owed": 35.50,
        "amount_paid": 0.00,
        "balance_remaining": 35.50,
        "payment_status": "pending"
      }
    ]
  }
}
```

#### POST /api/hangouts/:hangoutId/bill
Create bill for hangout.

**Request Body:**
```json
{
  "title": "Dinner Bill",
  "description": "Great dinner with friends",
  "paid_by": "uuid",
  "subtotal": 100.00,
  "tax_amount": 8.50,
  "tip_amount": 17.00,
  "total_amount": 125.50,
  "bill_date": "2024-01-01T20:00:00Z"
}
```

#### PUT /api/bills/:billId
Update bill details.

**Request Body:**
```json
{
  "title": "Updated Bill Title",
  "subtotal": 110.00,
  "tax_amount": 9.35,
  "tip_amount": 20.00,
  "total_amount": 139.35
}
```

### 🍽️ Bill Items Management

#### POST /api/bills/:billId/items
Add item to bill.

**Request Body:**
```json
{
  "item_name": "Grilled Salmon",
  "item_price": 22.00,
  "total_quantity": 2,
  "image_url": "https://..."
}
```

#### PUT /api/bill-items/:itemId
Update bill item.

**Request Body:**
```json
{
  "item_name": "Updated Salmon Dish",
  "item_price": 24.00,
  "total_quantity": 1
}
```

#### DELETE /api/bill-items/:itemId
Remove item from bill.

### 🎯 Item Assignments

#### POST /api/bill-items/:itemId/assignments
Assign item to user.

**Request Body:**
```json
{
  "user_id": "uuid",
  "quantity": 1,
  "assigned_amount": 22.00
}
```

#### PUT /api/item-assignments/:assignmentId
Update item assignment.

**Request Body:**
```json
{
  "quantity": 2,
  "assigned_amount": 44.00
}
```

#### DELETE /api/item-assignments/:assignmentId
Remove item assignment.

### 💳 Payments Management

#### GET /api/bills/:billId/payments
Get payments for a bill.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "from_user": {
        "id": "uuid",
        "full_name": "Jane Doe"
      },
      "to_user": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "amount": 35.50,
      "payment_method": "venmo",
      "status": "completed",
      "transaction_id": "venmo_123",
      "notes": "Thanks for dinner!",
      "payment_date": "2024-01-01T21:00:00Z",
      "created_at": "2024-01-01T20:30:00Z"
    }
  ]
}
```

#### POST /api/bills/:billId/payments
Record a payment.

**Request Body:**
```json
{
  "to_user_id": "uuid",
  "amount": 35.50,
  "payment_method": "venmo",
  "transaction_id": "venmo_123",
  "notes": "Thanks for dinner!"
}
```

#### PUT /api/payments/:paymentId
Update payment status.

**Request Body:**
```json
{
  "status": "completed",
  "payment_date": "2024-01-01T21:00:00Z"
}
```

### 📊 Balances & Analytics

#### GET /api/users/balances
Get user's balance summary across all bills.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_owed": 125.75,
    "total_to_receive": 89.25,
    "net_balance": -36.50,
    "pending_payments": 3,
    "recent_activity": [
      {
        "hangout_title": "Dinner at Steak House",
        "amount": 35.50,
        "status": "pending",
        "due_to": "John Doe"
      }
    ]
  }
}
```

#### GET /api/bills/:billId/summary
Get bill summary with all balances.

**Response:**
```json
{
  "success": true,
  "data": {
    "bill_total": 125.50,
    "items_count": 8,
    "participants_count": 4,
    "total_collected": 89.00,
    "total_pending": 36.50,
    "settlement_status": "partial",
    "balances": [
      {
        "user_id": "uuid",
        "user_name": "Jane Doe",
        "total_owed": 35.50,
        "amount_paid": 0.00,
        "balance_remaining": 35.50,
        "payment_status": "pending"
      }
    ]
  }
}
```

### 📱 Activity Timeline

#### GET /api/hangouts/:hangoutId/activities
Get activity timeline for hangout.

**Query Parameters:**
- `limit` (number): Results limit (default: 50)
- `activity_type` (string): Filter by activity type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "activity_type": "item_assigned",
      "user": {
        "id": "uuid",
        "full_name": "Jane Doe"
      },
      "activity_data": {
        "item_name": "Grilled Salmon",
        "quantity": 1,
        "amount": 22.00
      },
      "created_at": "2024-01-01T20:15:00Z"
    }
  ]
}
```

#### POST /api/hangouts/:hangoutId/activities
Log activity (system use).

**Request Body:**
```json
{
  "activity_type": "payment_made",
  "activity_data": {
    "amount": 35.50,
    "payment_method": "venmo",
    "to_user": "John Doe"
  }
}
```

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Invalid request data
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (e.g., duplicate)
- `INTERNAL_ERROR` (500): Server error

## Database Integration

### Connection Setup

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

### Row Level Security

The API server uses the service role key to bypass RLS for administrative operations, but should implement user context for user-specific operations:

```javascript
// Set user context for RLS
const { data, error } = await supabase
  .from('hangouts')
  .select('*')
  .eq('created_by', userId);
```

### Transaction Handling

For complex operations (like creating bills with items), use database transactions:

```javascript
const { data, error } = await supabase.rpc('create_bill_with_items', {
  hangout_id: hangoutId,
  bill_data: billData,
  items: itemsArray
});
```

## Middleware Stack

### Required Middleware

1. **CORS**: Enable cross-origin requests
2. **Body Parser**: Parse JSON request bodies
3. **Authentication**: Verify Supabase JWT tokens
4. **Validation**: Validate request schemas
5. **Error Handler**: Standardize error responses
6. **Logging**: Log requests and responses

### Example Express Setup

```javascript
const express = require('express');
const cors = require('cors');
const { authenticateUser, validateRequest } = require('./middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', authenticateUser);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/hangouts', hangoutsRoutes);
app.use('/api/bills', billsRoutes);

// Error handling
app.use(errorHandler);
```

## Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CORS Configuration
CORS_ORIGIN=http://localhost:8082,https://your-app.com

# Optional: External Services
UPLOAD_SERVICE_URL=https://your-upload-service.com
NOTIFICATION_SERVICE_URL=https://your-notification-service.com
```

## Testing Strategy

### Unit Tests
- Test individual functions and utilities
- Mock database calls
- Validate business logic

### Integration Tests
- Test API endpoints end-to-end
- Use test database
- Verify database interactions

### Example Test Structure

```javascript
describe('Hangouts API', () => {
  describe('POST /api/hangouts', () => {
    it('should create a new hangout', async () => {
      const response = await request(app)
        .post('/api/hangouts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Hangout',
          location_name: 'Test Location',
          hangout_date: '2024-01-01T19:00:00Z'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Hangout');
    });
  });
});
```

## Deployment Considerations

### Production Setup
- Use process managers (PM2, Docker)
- Implement health checks
- Set up monitoring and logging
- Configure rate limiting
- Use HTTPS/TLS

### Performance Optimization
- Implement caching (Redis)
- Use database connection pooling
- Optimize database queries
- Implement pagination
- Add response compression

### Security Best Practices
- Validate all inputs
- Use parameterized queries
- Implement rate limiting
- Log security events
- Regular security updates

## API Documentation

Generate interactive API documentation using Swagger/OpenAPI:

```yaml
openapi: 3.0.0
info:
  title: Claude Split Bill API
  version: 1.0.0
  description: API for managing hangouts and bill splitting
paths:
  /api/hangouts:
    get:
      summary: Get user's hangouts
      # ... detailed specification
```

This API specification provides a complete backend solution for your Claude Split Bill App, working seamlessly with the database schema we implemented!

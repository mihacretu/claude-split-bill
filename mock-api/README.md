# Split Bill Mock API

A comprehensive mock API server for the Split Bill application, providing realistic data and endpoints for development and testing.

## 🚀 Quick Start

### Installation

```bash
cd mock-api
npm install
```

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

### Health Check

Visit `http://localhost:3001/health` to verify the server is running.

## 📚 API Documentation

Full API documentation is available at: `http://localhost:3001/api/docs`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Demo Credentials

For testing purposes, use these demo credentials:

```json
{
  "email": "you@example.com",
  "password": "password123"
}
```

All demo users use the same password: `password123`

## 🛠 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login with email and password | No |
| POST | `/auth/register` | Register new user account | No |
| GET | `/auth/me` | Get current user profile | Yes |
| PUT | `/auth/me` | Update user profile | Yes |
| POST | `/auth/refresh` | Refresh JWT token | Yes |
| POST | `/auth/logout` | Logout | Yes |

### Bills (`/api/bills`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/bills` | Get user's bills with pagination | Yes |
| GET | `/bills/:billId` | Get specific bill details | Yes |
| POST | `/bills` | Create new bill | Yes |
| PUT | `/bills/:billId` | Update bill | Yes |
| DELETE | `/bills/:billId` | Delete bill (creator only) | Yes |
| POST | `/bills/:billId/payments` | Add payment to bill | Yes |
| GET | `/bills/:billId/activities` | Get bill activity history | Yes |

### Restaurants (`/api/restaurants`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/restaurants` | Search restaurants with filters | No |
| GET | `/restaurants/:restaurantId` | Get restaurant details | No |
| GET | `/restaurants/:restaurantId/menu` | Get restaurant menu | No |
| GET | `/restaurants/menu/items` | Search all menu items | No |

### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/search` | Search users | Yes |
| GET | `/users/nearby` | Get nearby friends | Yes |
| GET | `/users/friends` | Get friends list | Yes |
| POST | `/users/friends/request` | Send friend request | Yes |
| PUT | `/users/friends/request/:friendshipId` | Accept/decline friend request | Yes |
| DELETE | `/users/friends/:friendshipId` | Remove friend | Yes |
| GET | `/users/:userId` | Get user profile by ID | No |

## 📝 Example Requests

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "password123"
  }'
```

### Get Bills

```bash
curl -X GET http://localhost:3001/api/bills \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Create Bill

```bash
curl -X POST http://localhost:3001/api/bills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "title": "Dinner at Restaurant",
    "restaurantId": 1,
    "totalAmount": 45.50,
    "tax": 3.64,
    "tip": 9.10,
    "participants": [
      {
        "id": 1,
        "name": "You",
        "items": [
          {
            "id": "item-1",
            "menuItemId": 1,
            "name": "Caesar Salad",
            "price": 12.50,
            "quantity": 1
          }
        ],
        "subtotal": 12.50,
        "netBalance": 0
      }
    ],
    "splitMethod": "itemized"
  }'
```

### Search Restaurants

```bash
curl -X GET "http://localhost:3001/api/restaurants?search=pizza&cuisine=italian&limit=10"
```

## 📊 Sample Data

The mock API includes realistic sample data:

### Users
- **You** (you@example.com) - Main user account
- **Tom** (tom@example.com) - Friend with active bills
- **Jessica** (jessica@example.com) - Friend with bill history
- **Oliver, Steve, Anna, Mark, Sofia** - Additional users for testing

### Bills
- **Active Bills**: Current bills with pending payments
- **Historical Bills**: Settled bills from previous months
- **Bill Activities**: Transaction history and updates

### Restaurants
- **Steak House** - American cuisine, premium pricing
- **Pizza Kingdom** - Italian cuisine, moderate pricing  
- **Nobu Sushi** - Japanese cuisine, premium pricing

### Menu Items
- 12+ diverse food items with categories, prices, allergens, and dietary info
- High-quality Unsplash images for visual appeal

## 🔧 Configuration

### CORS Settings

The server allows requests from:
- `http://localhost:8082` (Expo development server)
- `http://localhost:19006` (Expo web)
- `http://localhost:3000` (React development server)

### JWT Configuration

- **Secret**: `your-super-secret-jwt-key-change-in-production`
- **Expiration**: 24 hours
- **Algorithm**: HS256

> ⚠️ **Security Note**: Change the JWT secret in production!

## 🧪 Testing

### Manual Testing

1. Start the server: `npm run dev`
2. Visit the API docs: `http://localhost:3001/api/docs`
3. Use the provided demo credentials to test authentication
4. Test various endpoints using curl, Postman, or your app

### Integration with Your App

Update your app's API base URL to point to the mock server:

```javascript
// In your React Native app
const API_BASE_URL = 'http://localhost:3001/api';

// Example API call
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  return data;
};
```

## 🚀 Deployment

### Local Development

The mock server is designed for local development. It stores data in memory, so all data resets when the server restarts.

### Production Considerations

When implementing a real API server:

1. **Database**: Replace in-memory data with a real database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Implement proper user registration, password hashing, and session management
3. **Security**: Add rate limiting, input validation, and security headers
4. **File Storage**: Implement proper image upload and storage for receipts and avatars
5. **Real-time Features**: Add WebSocket support for real-time bill updates
6. **Payment Integration**: Integrate with payment processors (Stripe, PayPal, etc.)
7. **Location Services**: Implement proper geolocation and nearby user detection
8. **Push Notifications**: Add notification services for bill updates and friend requests

## 🛡️ Security Features

The mock API includes basic security measures:

- JWT token authentication
- Password hashing (bcrypt)
- CORS configuration
- Input validation
- Error handling
- Request logging

## 📱 Mobile App Integration

This mock API is designed to work seamlessly with your React Native split bill app:

1. **Timeline Data**: Provides formatted bill data for the home screen timeline
2. **Bill Details**: Comprehensive bill information with participant details
3. **User Management**: Friend system with search and nearby user features
4. **Restaurant Data**: Menu items and restaurant information for bill creation
5. **Real-time Updates**: Activity logs for bill changes and payments

## 🤝 Contributing

When extending the mock API:

1. Add new endpoints to the appropriate route files
2. Update the documentation in this README
3. Include sample data that reflects real-world usage
4. Maintain consistent error handling and response formats

## 📄 License

MIT License - Feel free to use this mock API for your development needs!

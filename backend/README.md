# Claude Split Bill Backend Services

A function-based backend library for the Claude Split Bill app. This backend provides all the necessary services for managing users, hangouts, bills, and payments without requiring server deployment.

## Features

- 🚀 **No Server Required**: Functions run directly in your React Native app
- 🔐 **Authentication Ready**: Integrates with your existing Supabase Auth
- 📊 **Complete Business Logic**: User management, hangouts, bill splitting, payments
- ✅ **Input Validation**: Built-in validation with detailed error messages
- 🛡️ **Type Safety**: Ready for TypeScript migration
- 🔄 **Real-time Ready**: Works with Supabase real-time subscriptions
- 🧪 **Testable**: Clean separation of concerns for easy testing

## Quick Start

### Installation

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in your project root:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_public_key_here
```

### Basic Usage

```javascript
import { UserService, HangoutService, BillService, PaymentService } from './backend';

// Initialize services with user's access token from Supabase Auth
const accessToken = user.session.access_token;

const userService = new UserService(accessToken);
const hangoutService = new HangoutService(accessToken);
const billService = new BillService(accessToken);
const paymentService = new PaymentService(accessToken);

// Example: Create a hangout
const hangout = await hangoutService.createHangout({
  title: "Dinner at Mario's",
  location_name: "Mario's Restaurant",
  location_address: "123 Main St, City, State",
  latitude: 40.7128,
  longitude: -74.0060,
  hangout_date: new Date().toISOString()
}, userId);

// Example: Get user's hangouts
const hangouts = await hangoutService.getUserHangouts(userId, {
  status: 'active',
  limit: 20,
  offset: 0
});
```

### Convenience Initialization

```javascript
import { initializeServices } from './backend';

// Initialize all services at once
const { userService, hangoutService, billService, paymentService } = initializeServices(accessToken);
```

## Services Overview

### UserService

Manages user profiles, friendships, and social features.

```javascript
// Update user profile
await userService.updateProfile(userId, {
  full_name: "John Doe",
  avatar_url: "https://example.com/avatar.jpg"
});

// Search for users
const users = await userService.searchUsers("john", currentUserId, 10);

// Send friend request
await userService.sendFriendRequest(requesterId, addresseeId);

// Get friends list
const friends = await userService.getFriends(userId);
```

### HangoutService

Handles hangout creation, management, and participant coordination.

```javascript
// Create hangout
const hangout = await hangoutService.createHangout({
  title: "Team Lunch",
  location_name: "Local Bistro",
  hangout_date: new Date().toISOString()
}, creatorId);

// Add participant
await hangoutService.addParticipant(hangoutId, participantId, creatorId);

// Get hangout details
const details = await hangoutService.getHangoutDetails(hangoutId, userId);

// Get activity timeline
const activities = await hangoutService.getActivityTimeline(hangoutId, userId);
```

### BillService

Manages bill creation, item management, and assignment logic.

```javascript
// Create bill for hangout
const bill = await billService.createBill(hangoutId, {
  paid_by: payerId,
  title: "Dinner Bill",
  subtotal: 45.00,
  tax_amount: 4.50,
  tip_amount: 9.00,
  total_amount: 58.50,
  bill_date: new Date().toISOString()
}, userId);

// Add item to bill
const item = await billService.addItem(billId, {
  item_name: "Pizza Margherita",
  item_price: 15.99,
  total_quantity: 2
}, userId);

// Assign item to user
await billService.assignItem(itemId, {
  user_id: participantId,
  quantity: 1,
  assigned_amount: 15.99
}, userId);

// Split item equally among participants
await billService.splitItemEqually(itemId, [user1Id, user2Id, user3Id], userId);
```

### PaymentService

Handles payment creation, tracking, and settlement.

```javascript
// Create payment
const payment = await paymentService.createPayment(billId, {
  from_user_id: payerId,
  to_user_id: receiverId,
  amount: 25.50,
  payment_method: 'venmo',
  notes: 'Thanks for covering dinner!'
}, userId);

// Mark payment as completed
await paymentService.markPaymentCompleted(paymentId, userId, {
  transaction_id: 'venmo_12345',
  notes: 'Payment confirmed'
});

// Get payment history
const history = await paymentService.getPaymentHistory(userId, {
  type: 'sent',
  status: 'completed',
  limit: 20
});

// Settle all balances for a bill
await paymentService.settleAllBalances(billId, userId);
```

## Error Handling

The backend uses custom error classes for different types of failures:

```javascript
import { 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError,
  ConflictError,
  BusinessLogicError 
} from './backend';

try {
  await hangoutService.createHangout(invalidData, userId);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.details);
  } else if (error instanceof AuthorizationError) {
    console.log('Access denied:', error.message);
  } else if (error instanceof BusinessLogicError) {
    console.log('Business rule violation:', error.message);
  }
  
  // All errors have a consistent structure
  console.log(error.toJSON());
}
```

## Validation

Input validation is built-in using Joi schemas:

```javascript
// Validation happens automatically in service methods
const hangout = await hangoutService.createHangout({
  title: "", // Will fail validation - title required
  hangout_date: "invalid-date" // Will fail validation - invalid date format
}, userId);

// Manual validation if needed
import { validate, hangoutSchemas } from './backend';

const validatedData = validate(hangoutData, hangoutSchemas.create, 'hangout data');
```

## Database Helpers

Utility functions for common database operations:

```javascript
import { 
  calculateBillTotals, 
  calculateItemAssignments, 
  formatCurrency,
  calculateDistance 
} from './backend';

// Calculate bill totals and validate
const totals = calculateBillTotals({
  subtotal: 45.00,
  tax_amount: 4.50,
  tip_amount: 9.00,
  total_amount: 58.50
});

// Format currency for display
const formatted = formatCurrency(25.50); // "$25.50"

// Calculate distance between coordinates
const distance = calculateDistance(lat1, lon1, lat2, lon2); // kilometers
```

## Health Check

Monitor backend service health:

```javascript
import { healthCheck } from './backend';

const health = await healthCheck(accessToken);
console.log(health);
// {
//   status: 'healthy',
//   version: '1.0.0',
//   supabase_connection: 'connected',
//   services: { ... }
// }
```

## Advanced Usage

### Custom Queries

For advanced use cases, access models directly:

```javascript
import { HangoutModel } from './backend';

const hangoutModel = new HangoutModel(accessToken);

// Execute custom query
const result = await hangoutModel.executeCustomQuery(
  (supabase) => supabase
    .from('hangouts')
    .select('*')
    .eq('status', 'active')
    .gte('created_at', startDate),
  'get recent active hangouts'
);
```

### Batch Operations

```javascript
// Process multiple operations
const results = await Promise.all([
  hangoutService.getUserHangouts(userId),
  userService.getFriends(userId),
  paymentService.getPaymentSummary(userId)
]);
```

### Real-time Integration

```javascript
import { createAuthenticatedClient } from './backend';

// Subscribe to real-time changes
const supabase = createAuthenticatedClient(accessToken);

supabase
  .from('bills')
  .on('UPDATE', payload => {
    console.log('Bill updated:', payload.new);
  })
  .subscribe();
```

## Database Schema

This backend works with the database schema defined in `database-structure.md`. Key tables include:

- **users**: User profiles and authentication data
- **hangouts**: Social gatherings where bills are split
- **hangout_participants**: Users participating in hangouts
- **bills**: Bills associated with hangouts (one per hangout)
- **bill_items**: Individual items from bills
- **item_assignments**: Assignment of items to users
- **participant_balances**: Tracking of who owes what
- **payments**: Payment records between users
- **friendships**: Friend relationships between users
- **hangout_activities**: Activity timeline for audit trails

## Migration from Existing Code

If you're migrating from the existing server/mock-api structure:

1. **Replace API calls** with service method calls
2. **Update authentication** to pass access tokens to service constructors
3. **Handle errors** using the new error classes
4. **Update validation** to use the built-in validation (or remove client-side validation)

### Before (API calls)
```javascript
const response = await fetch('/api/hangouts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(hangoutData)
});
const hangout = await response.json();
```

### After (Service calls)
```javascript
const hangoutService = new HangoutService(token);
const hangout = await hangoutService.createHangout(hangoutData, userId);
```

## Testing

```javascript
// Example test structure
import { UserService } from '../backend';

describe('UserService', () => {
  let userService;
  
  beforeEach(() => {
    userService = new UserService(mockAccessToken);
  });
  
  test('should create user profile', async () => {
    const userData = { /* test data */ };
    const result = await userService.upsertProfile(userData);
    expect(result).toBeDefined();
  });
});
```

## Contributing

1. Follow the existing code patterns
2. Add validation schemas for new endpoints
3. Include error handling with appropriate error types
4. Add JSDoc comments for new functions
5. Update this README for new features

## License

MIT License - see LICENSE file for details.

---

For more detailed API documentation, see the individual service files in the `services/` directory.

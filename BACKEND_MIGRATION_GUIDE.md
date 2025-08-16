# Backend Migration Guide

## 🎯 What Changed

- ❌ **Removed**: `mock-api/` and `server/` folders
- ✅ **Added**: `backend/` folder with function-based services
- 🔄 **Updated**: App now uses direct function calls instead of HTTP API calls

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies (app + backend)
npm run install:all

# Or install separately
npm install
npm run backend:install
```

### 2. Environment Setup

Your `.env` file should have:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_public_key_here
```

### 3. Basic Usage

```javascript
import { useBackendServices } from './lib/backend-integration';

// In your component or function
const handleCreateHangout = async () => {
  try {
    const { hangoutService } = await useBackendServices();
    const hangout = await hangoutService.createHangout({
      title: "Dinner at Mario's",
      location_name: "Mario's Restaurant",
      hangout_date: new Date().toISOString()
    }, userId);
    
    console.log('Hangout created:', hangout);
  } catch (error) {
    console.error('Failed to create hangout:', error.message);
  }
};
```

## 🔧 Migration Patterns

### Before (API Calls)
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

### After (Service Calls)
```javascript
const { hangoutService } = await useBackendServices();
const hangout = await hangoutService.createHangout(hangoutData, userId);
```

## 📚 Available Services

### UserService
- `getProfile(userId)`
- `updateProfile(userId, updates)`
- `searchUsers(query, currentUserId, limit)`
- `getFriends(userId, status)`
- `sendFriendRequest(requesterId, addresseeId)`
- `respondToFriendRequest(friendshipId, userId, response)`

### HangoutService
- `createHangout(hangoutData, creatorId)`
- `getUserHangouts(userId, filters)`
- `getHangoutDetails(hangoutId, userId)`
- `addParticipant(hangoutId, participantId, creatorId)`
- `removeParticipant(hangoutId, participantId, creatorId)`
- `getActivityTimeline(hangoutId, userId, filters)`

### BillService
- `getBillForHangout(hangoutId, userId)`
- `createBill(hangoutId, billData, userId)`
- `addItem(billId, itemData, userId)`
- `assignItem(itemId, assignmentData, userId)`
- `splitItemEqually(itemId, participantIds, userId)`
- `calculateBalances(billId, userId)`

### PaymentService
- `createPayment(billId, paymentData, userId)`
- `markPaymentCompleted(paymentId, userId, completionData)`
- `getPaymentHistory(userId, filters)`
- `settleAllBalances(billId, userId)`

## 🎨 Integration Helpers

### Auto-initialization
The backend automatically initializes when users sign in/out:

```javascript
// This is already set up in App.js
import { setupBackendAuthListener } from './lib/backend-integration';
setupBackendAuthListener();
```

### Error Handling
```javascript
import { handleBackendOperation } from './lib/backend-integration';

const result = await handleBackendOperation(async () => {
  const { userService } = await useBackendServices();
  return userService.searchUsers(query, userId);
}, {
  showLoading: true,
  errorMessage: 'Failed to search users'
});
```

### Health Check
```javascript
import { checkBackendHealth } from './lib/backend-integration';

const health = await checkBackendHealth();
console.log('Backend status:', health.status);
```

## 🔍 Examples

See `lib/migration-examples.js` for detailed before/after examples of:
- User management operations
- Hangout creation and management
- Bill operations
- Payment handling
- Complex batch operations
- Error handling patterns

## 🐛 Debugging

### Check Backend Status
```javascript
import { isBackendInitialized, getCurrentUser } from './lib/backend-integration';

console.log('Backend initialized:', isBackendInitialized());
console.log('Current user:', getCurrentUser());
```

### View Service Health
```javascript
import { checkBackendHealth } from './lib/backend-integration';

const health = await checkBackendHealth();
console.log('Services:', health.services);
console.log('Supabase:', health.supabase_connection);
```

## 🚨 Common Issues

### 1. "Backend services not initialized"
**Solution**: Make sure user is signed in and services are initialized
```javascript
import { useBackendServices } from './lib/backend-integration';

// Always use this instead of getBackendServices() for safety
const services = await useBackendServices();
```

### 2. "Access token required"
**Solution**: User needs to be authenticated with Supabase
```javascript
// Check auth status
const { user, session } = await supabase.auth.getUser();
if (!user) {
  // Redirect to login
}
```

### 3. Import errors
**Solution**: Use correct import paths
```javascript
// ✅ Correct
import { UserService } from './backend';
import { useBackendServices } from './lib/backend-integration';

// ❌ Wrong
import { UserService } from '../backend';
```

## 📝 Development Scripts

```bash
# Test backend services
npm run backend:test

# Lint backend code
npm run backend:lint

# Install all dependencies
npm run install:all
```

## 🎯 Next Steps

1. **Update existing screens** to use the new backend services
2. **Remove old API utility files** that made HTTP requests
3. **Test all functionality** to ensure everything works
4. **Add error handling** using the new error types
5. **Optimize performance** with batch operations where possible

## 📖 Full Documentation

- Backend services: `backend/README.md`
- Migration examples: `lib/migration-examples.js`
- Integration helpers: `lib/backend-integration.js`

---

**Need help?** Check the examples in `lib/migration-examples.js` or refer to the full backend documentation in `backend/README.md`.

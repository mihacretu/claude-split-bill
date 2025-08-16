/**
 * Migration Examples: From API Calls to Backend Services
 * 
 * This file shows how to migrate from HTTP API calls to the new backend services.
 * Use these examples as a reference when updating your existing code.
 */

import { useBackendServices, handleBackendOperation } from './backend-integration';

// ============================================================================
// USER MANAGEMENT EXAMPLES
// ============================================================================

/**
 * BEFORE: API call to get user profile
 */
const getUserProfileOld = async (userId, token) => {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }
  
  return response.json();
};

/**
 * AFTER: Backend service call
 */
export const getUserProfile = async (userId) => {
  return handleBackendOperation(async () => {
    const { userService } = await useBackendServices();
    return userService.getProfile(userId);
  }, { 
    errorMessage: 'Failed to get user profile' 
  });
};

/**
 * BEFORE: API call to search users
 */
const searchUsersOld = async (query, token) => {
  const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};

/**
 * AFTER: Backend service call
 */
export const searchUsers = async (query, currentUserId, limit = 10) => {
  return handleBackendOperation(async () => {
    const { userService } = await useBackendServices();
    return userService.searchUsers(query, currentUserId, limit);
  });
};

/**
 * BEFORE: API call to send friend request
 */
const sendFriendRequestOld = async (addresseeId, token) => {
  const response = await fetch('/api/users/friends/request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ addressee_id: addresseeId })
  });
  
  return response.json();
};

/**
 * AFTER: Backend service call
 */
export const sendFriendRequest = async (requesterId, addresseeId) => {
  return handleBackendOperation(async () => {
    const { userService } = await useBackendServices();
    return userService.sendFriendRequest(requesterId, addresseeId);
  }, {
    errorMessage: 'Failed to send friend request'
  });
};

// ============================================================================
// HANGOUT MANAGEMENT EXAMPLES
// ============================================================================

/**
 * BEFORE: API call to create hangout
 */
const createHangoutOld = async (hangoutData, token) => {
  const response = await fetch('/api/hangouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(hangoutData)
  });
  
  return response.json();
};

/**
 * AFTER: Backend service call
 */
export const createHangout = async (hangoutData, creatorId) => {
  return handleBackendOperation(async () => {
    const { hangoutService } = await useBackendServices();
    return hangoutService.createHangout(hangoutData, creatorId);
  }, {
    showLoading: true,
    errorMessage: 'Failed to create hangout'
  });
};

/**
 * BEFORE: API call to get user's hangouts
 */
const getUserHangoutsOld = async (userId, filters, token) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/hangouts?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};

/**
 * AFTER: Backend service call
 */
export const getUserHangouts = async (userId, filters = {}) => {
  return handleBackendOperation(async () => {
    const { hangoutService } = await useBackendServices();
    return hangoutService.getUserHangouts(userId, filters);
  });
};

/**
 * BEFORE: API call to add participant
 */
const addParticipantOld = async (hangoutId, participantId, token) => {
  const response = await fetch(`/api/hangouts/${hangoutId}/participants`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: participantId })
  });
  
  return response.json();
};

/**
 * AFTER: Backend service call
 */
export const addParticipant = async (hangoutId, participantId, creatorId) => {
  return handleBackendOperation(async () => {
    const { hangoutService } = await useBackendServices();
    return hangoutService.addParticipant(hangoutId, participantId, creatorId);
  }, {
    errorMessage: 'Failed to add participant'
  });
};

// ============================================================================
// BILL MANAGEMENT EXAMPLES
// ============================================================================

/**
 * BEFORE: API call to create bill
 */
const createBillOld = async (hangoutId, billData, token) => {
  const response = await fetch(`/api/hangouts/${hangoutId}/bill`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(billData)
  });
  
  return response.json();
};

/**
 * AFTER: Backend service call
 */
export const createBill = async (hangoutId, billData, userId) => {
  return handleBackendOperation(async () => {
    const { billService } = await useBackendServices();
    return billService.createBill(hangoutId, billData, userId);
  }, {
    showLoading: true,
    errorMessage: 'Failed to create bill'
  });
};

/**
 * BEFORE: API call to add item to bill
 */
const addItemToBillOld = async (billId, itemData, token) => {
  const response = await fetch(`/api/bills/${billId}/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(itemData)
  });
  
  return response.json();
};

/**
 * AFTER: Backend service call
 */
export const addItemToBill = async (billId, itemData, userId) => {
  return handleBackendOperation(async () => {
    const { billService } = await useBackendServices();
    return billService.addItem(billId, itemData, userId);
  }, {
    errorMessage: 'Failed to add item to bill'
  });
};

/**
 * BEFORE: API call to assign item
 */
const assignItemOld = async (itemId, assignmentData, token) => {
  const response = await fetch(`/api/bill-items/${itemId}/assignments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(assignmentData)
  });
  
  return response.json();
};

/**
 * AFTER: Backend service call
 */
export const assignItem = async (itemId, assignmentData, userId) => {
  return handleBackendOperation(async () => {
    const { billService } = await useBackendServices();
    return billService.assignItem(itemId, assignmentData, userId);
  }, {
    errorMessage: 'Failed to assign item'
  });
};

// ============================================================================
// PAYMENT MANAGEMENT EXAMPLES
// ============================================================================

/**
 * BEFORE: API call to create payment
 */
const createPaymentOld = async (billId, paymentData, token) => {
  const response = await fetch(`/api/bills/${billId}/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });
  
  return response.json();
};

/**
 * AFTER: Backend service call
 */
export const createPayment = async (billId, paymentData, userId) => {
  return handleBackendOperation(async () => {
    const { paymentService } = await useBackendServices();
    return paymentService.createPayment(billId, paymentData, userId);
  }, {
    showLoading: true,
    errorMessage: 'Failed to create payment'
  });
};

/**
 * BEFORE: API call to get payment history
 */
const getPaymentHistoryOld = async (userId, filters, token) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/payments?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};

/**
 * AFTER: Backend service call
 */
export const getPaymentHistory = async (userId, filters = {}) => {
  return handleBackendOperation(async () => {
    const { paymentService } = await useBackendServices();
    return paymentService.getPaymentHistory(userId, filters);
  });
};

// ============================================================================
// REACT NATIVE COMPONENT INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example: React Native component using the new backend
 */
export const ExampleHangoutComponent = () => {
  const [hangouts, setHangouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load hangouts using the new backend
  const loadHangouts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { hangoutService } = await useBackendServices();
      const result = await hangoutService.getUserHangouts(userId, {
        status: 'active',
        limit: 20
      });
      
      setHangouts(result.data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load hangouts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new hangout
  const handleCreateHangout = async (hangoutData) => {
    try {
      const newHangout = await createHangout(hangoutData, userId);
      setHangouts(prev => [newHangout, ...prev]);
      
      // Show success message
      Alert.alert('Success', 'Hangout created successfully!');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  useEffect(() => {
    loadHangouts();
  }, []);

  // ... rest of component
};

// ============================================================================
// BATCH OPERATIONS EXAMPLES
// ============================================================================

/**
 * Example: Loading multiple data types at once
 */
export const loadDashboardData = async (userId) => {
  return handleBackendOperation(async () => {
    const services = await useBackendServices();
    
    // Load multiple data types in parallel
    const [hangouts, friends, paymentSummary] = await Promise.all([
      services.hangoutService.getUserHangouts(userId, { limit: 10 }),
      services.userService.getFriends(userId),
      services.paymentService.getPaymentSummary(userId)
    ]);

    return {
      hangouts: hangouts.data,
      friends,
      paymentSummary
    };
  }, {
    showLoading: true,
    errorMessage: 'Failed to load dashboard data'
  });
};

/**
 * Example: Complex operation with multiple steps
 */
export const createHangoutWithParticipants = async (hangoutData, participantIds, creatorId) => {
  return handleBackendOperation(async () => {
    const { hangoutService } = await useBackendServices();
    
    // Create hangout
    const hangout = await hangoutService.createHangout(hangoutData, creatorId);
    
    // Add participants
    const participants = await Promise.all(
      participantIds.map(participantId => 
        hangoutService.addParticipant(hangout.id, participantId, creatorId)
      )
    );
    
    return {
      hangout,
      participants
    };
  }, {
    showLoading: true,
    errorMessage: 'Failed to create hangout with participants'
  });
};

// ============================================================================
// ERROR HANDLING EXAMPLES
// ============================================================================

/**
 * Example: Handling specific error types
 */
export const handleSpecificErrors = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    // Handle specific backend error types
    if (error.name === 'ValidationError') {
      Alert.alert('Invalid Input', error.message);
    } else if (error.name === 'AuthorizationError') {
      Alert.alert('Access Denied', 'You don\'t have permission to perform this action');
    } else if (error.name === 'NotFoundError') {
      Alert.alert('Not Found', 'The requested resource was not found');
    } else if (error.name === 'ConflictError') {
      Alert.alert('Conflict', error.message);
    } else {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    throw error;
  }
};

export default {
  // User operations
  getUserProfile,
  searchUsers,
  sendFriendRequest,
  
  // Hangout operations
  createHangout,
  getUserHangouts,
  addParticipant,
  
  // Bill operations
  createBill,
  addItemToBill,
  assignItem,
  
  // Payment operations
  createPayment,
  getPaymentHistory,
  
  // Complex operations
  loadDashboardData,
  createHangoutWithParticipants,
  
  // Error handling
  handleSpecificErrors
};

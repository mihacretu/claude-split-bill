// API Service for Split Bill App
const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add auth token if available
  const token = getStoredToken();
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Token storage helpers (you might want to use AsyncStorage in production)
let authToken = null;

const getStoredToken = () => authToken;
const setStoredToken = (token) => { authToken = token; };
const clearStoredToken = () => { authToken = null; };

// Authentication API calls
export const authAPI = {
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.success && data.data.token) {
      setStoredToken(data.data.token);
    }
    
    return data;
  },

  register: async (email, password, name, username, phone) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, username, phone }),
    });
    
    if (data.success && data.data.token) {
      setStoredToken(data.data.token);
    }
    
    return data;
  },

  getProfile: async () => {
    return await apiRequest('/auth/me');
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      clearStoredToken();
    }
  },
};

// Bills API calls
export const billsAPI = {
  getBills: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/bills?${queryString}` : '/bills';
    return await apiRequest(endpoint);
  },

  getBillById: async (billId) => {
    return await apiRequest(`/bills/${billId}`);
  },

  createBill: async (billData) => {
    return await apiRequest('/bills', {
      method: 'POST',
      body: JSON.stringify(billData),
    });
  },

  updateBill: async (billId, updateData) => {
    return await apiRequest(`/bills/${billId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  addPayment: async (billId, paymentData) => {
    return await apiRequest(`/bills/${billId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  getBillActivities: async (billId) => {
    return await apiRequest(`/bills/${billId}/activities`);
  },
};

// Restaurants API calls
export const restaurantsAPI = {
  getRestaurants: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/restaurants?${queryString}` : '/restaurants';
    return await apiRequest(endpoint);
  },

  getRestaurantById: async (restaurantId) => {
    return await apiRequest(`/restaurants/${restaurantId}`);
  },

  getRestaurantMenu: async (restaurantId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? 
      `/restaurants/${restaurantId}/menu?${queryString}` : 
      `/restaurants/${restaurantId}/menu`;
    return await apiRequest(endpoint);
  },

  searchMenuItems: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? 
      `/restaurants/menu/items?${queryString}` : 
      '/restaurants/menu/items';
    return await apiRequest(endpoint);
  },
};

// Users API calls
export const usersAPI = {
  searchUsers: async (query, params = {}) => {
    const searchParams = new URLSearchParams({ q: query, ...params });
    return await apiRequest(`/users/search?${searchParams}`);
  },

  getNearbyFriends: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/nearby?${queryString}` : '/users/nearby';
    return await apiRequest(endpoint);
  },

  getFriends: async (status = 'accepted') => {
    return await apiRequest(`/users/friends?status=${status}`);
  },

  sendFriendRequest: async (userId) => {
    return await apiRequest('/users/friends/request', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  respondToFriendRequest: async (friendshipId, action) => {
    return await apiRequest(`/users/friends/request/${friendshipId}`, {
      method: 'PUT',
      body: JSON.stringify({ action }),
    });
  },

  getUserProfile: async (userId) => {
    return await apiRequest(`/users/${userId}`);
  },
};

// Export token helpers for use in components
export { getStoredToken, setStoredToken, clearStoredToken };

// Export API base URL for reference
export { API_BASE_URL };

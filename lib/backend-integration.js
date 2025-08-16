/**
 * Backend Integration Helper
 * 
 * This file provides easy integration between the React Native app
 * and the new backend services.
 */

import { UserService } from '../backend/services/UserService.js';
import { HangoutService } from '../backend/services/HangoutService.js';
import { BillService } from '../backend/services/BillService.js';
import { PaymentService } from '../backend/services/PaymentService.js';
import { supabase } from '../src/config/supabase';

// Get Supabase configuration for backend services
const getSupabaseConfig = () => {
  // Extract URL and anon key from the existing supabase client
  const url = supabase.supabaseUrl;
  const key = supabase.supabaseKey;
  
  return {
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: key
  };
};

/**
 * Backend services singleton
 * Automatically manages access tokens and service initialization
 */
class BackendManager {
  constructor() {
    this.services = null;
    this.currentAccessToken = null;
    this.user = null;
  }

  /**
   * Initialize backend services with current user session
   * @param {Object} session - Supabase session object
   * @returns {Object} Initialized services
   */
  async initialize(session = null) {
    try {
      // Get current session if not provided
      if (!session) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        session = currentSession;
      }

      if (!session?.access_token) {
        throw new Error('No valid session found. User must be authenticated.');
      }

      // Only reinitialize if access token changed
      if (this.currentAccessToken !== session.access_token) {
        this.currentAccessToken = session.access_token;
        this.user = session.user;
        
        // Initialize services with Supabase config
        const supabaseConfig = getSupabaseConfig();
        this.services = {
          userService: new UserService(session.access_token, supabaseConfig),
          hangoutService: new HangoutService(session.access_token, supabaseConfig),
          billService: new BillService(session.access_token, supabaseConfig),
          paymentService: new PaymentService(session.access_token, supabaseConfig)
        };
        
        console.log('✅ Backend services initialized for user:', this.user.email);
      }

      return this.services;
    } catch (error) {
      console.error('❌ Failed to initialize backend services:', error.message);
      throw error;
    }
  }

  /**
   * Get initialized services (throws if not initialized)
   * @returns {Object} Backend services
   */
  getServices() {
    if (!this.services) {
      throw new Error('Backend services not initialized. Call initialize() first.');
    }
    return this.services;
  }

  /**
   * Get current user info
   * @returns {Object|null} Current user
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Check if services are initialized
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this.services !== null;
  }

  /**
   * Perform health check on backend services
   * @returns {Promise<Object>} Health check results
   */
  async performHealthCheck() {
    if (!this.currentAccessToken) {
      throw new Error('Backend services not initialized');
    }
    
    try {
      // Test basic connectivity by getting current user
      const { data: { user }, error } = await supabase.auth.getUser();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        supabase_connection: error ? 'error' : 'connected',
        current_user: user?.email || 'unknown',
        services: {
          user_service: 'available',
          hangout_service: 'available',
          bill_service: 'available',
          payment_service: 'available'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        error: error.message,
        services: {
          user_service: 'unavailable',
          hangout_service: 'unavailable',
          bill_service: 'unavailable',
          payment_service: 'unavailable'
        }
      };
    }
  }

  /**
   * Clear services (on logout)
   */
  clear() {
    this.services = null;
    this.currentAccessToken = null;
    this.user = null;
    console.log('🔄 Backend services cleared');
  }
}

// Create singleton instance
const backendManager = new BackendManager();

/**
 * Hook-like function to get backend services
 * Automatically initializes if needed
 * @returns {Promise<Object>} Backend services
 */
export const useBackendServices = async () => {
  try {
    return await backendManager.initialize();
  } catch (error) {
    console.error('Failed to get backend services:', error);
    throw error;
  }
};

/**
 * Get backend services synchronously (must be initialized first)
 * @returns {Object} Backend services
 */
export const getBackendServices = () => {
  return backendManager.getServices();
};

/**
 * Initialize backend with specific session
 * @param {Object} session - Supabase session
 * @returns {Promise<Object>} Backend services
 */
export const initializeBackend = async (session) => {
  return backendManager.initialize(session);
};

/**
 * Clear backend services (call on logout)
 */
export const clearBackend = () => {
  backendManager.clear();
};

/**
 * Check if backend is initialized
 * @returns {boolean} True if initialized
 */
export const isBackendInitialized = () => {
  return backendManager.isInitialized();
};

/**
 * Get current user from backend
 * @returns {Object|null} Current user
 */
export const getCurrentUser = () => {
  return backendManager.getCurrentUser();
};

/**
 * Perform backend health check
 * @returns {Promise<Object>} Health check results
 */
export const checkBackendHealth = async () => {
  return backendManager.performHealthCheck();
};

/**
 * Wrapper for handling backend errors in React Native
 * @param {Function} operation - Backend operation to execute
 * @param {Object} options - Error handling options
 * @returns {Promise<any>} Operation result
 */
export const handleBackendOperation = async (operation, options = {}) => {
  const { 
    showLoading = false, 
    showError = true, 
    errorMessage = 'Operation failed' 
  } = options;

  try {
    if (showLoading) {
      // You can integrate with your loading state management here
      console.log('🔄 Backend operation in progress...');
    }

    const result = await operation();
    
    if (showLoading) {
      console.log('✅ Backend operation completed');
    }
    
    return result;
  } catch (error) {
    if (showError) {
      console.error('❌ Backend operation failed:', error.message);
      
      // You can integrate with your error notification system here
      // For example: showToast(error.message);
    }
    
    throw error;
  }
};

/**
 * Auto-retry wrapper for backend operations
 * @param {Function} operation - Backend operation to execute
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<any>} Operation result
 */
export const retryBackendOperation = async (operation, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        console.error(`❌ Backend operation failed after ${maxRetries + 1} attempts:`, error.message);
        throw error;
      }
      
      console.warn(`⚠️ Backend operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Setup auth state listener to automatically manage backend services
 * Call this in your app's initialization
 */
export const setupBackendAuthListener = () => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔐 Auth state changed:', event);
    
    if (event === 'SIGNED_IN' && session) {
      try {
        await backendManager.initialize(session);
        console.log('✅ Backend services auto-initialized on sign in');
      } catch (error) {
        console.error('❌ Failed to auto-initialize backend services:', error.message);
      }
    } else if (event === 'SIGNED_OUT') {
      backendManager.clear();
      console.log('🔄 Backend services cleared on sign out');
    } else if (event === 'TOKEN_REFRESHED' && session) {
      try {
        await backendManager.initialize(session);
        console.log('🔄 Backend services refreshed with new token');
      } catch (error) {
        console.error('❌ Failed to refresh backend services:', error.message);
      }
    }
  });
};

// Export the manager instance for advanced use cases
export { backendManager };

export default {
  useBackendServices,
  getBackendServices,
  initializeBackend,
  clearBackend,
  isBackendInitialized,
  getCurrentUser,
  checkBackendHealth,
  handleBackendOperation,
  retryBackendOperation,
  setupBackendAuthListener
};

/**
 * Claude Split Bill Backend Services
 * 
 * A function-based backend library for the Claude Split Bill app.
 * Provides services for user management, hangouts, bills, and payments
 * without requiring server deployment.
 * 
 * Usage:
 * ```javascript
 * import { UserService, HangoutService, BillService, PaymentService } from './backend';
 * 
 * // Initialize services with user's access token
 * const userService = new UserService(accessToken);
 * const hangoutService = new HangoutService(accessToken);
 * const billService = new BillService(accessToken);
 * const paymentService = new PaymentService(accessToken);
 * 
 * // Use services
 * const hangouts = await hangoutService.getUserHangouts(userId);
 * ```
 */

// Export services
export { UserService } from './services/UserService.js';
export { HangoutService } from './services/HangoutService.js';
export { BillService } from './services/BillService.js';
export { PaymentService } from './services/PaymentService.js';

// Export models (for advanced use cases)
export { UserModel } from './models/UserModel.js';
export { HangoutModel } from './models/HangoutModel.js';
export { BillModel } from './models/BillModel.js';
export { PaymentModel } from './models/PaymentModel.js';
export { BaseModel } from './models/BaseModel.js';

// Export utilities
export {
  createAuthenticatedClient,
  createAnonymousClient,
  executeQuery,
  getUserById,
  isHangoutParticipant,
  isHangoutCreator,
  logHangoutActivity
} from './utils/supabase.js';

export {
  BackendError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  BusinessLogicError,
  createErrorFromSupabase,
  handleAsyncOperation,
  validateRequiredFields,
  validateUUID
} from './utils/errors.js';

export {
  validate,
  validatePagination,
  validateCoordinates,
  createValidator,
  userSchemas,
  friendshipSchemas,
  hangoutSchemas,
  billSchemas,
  billItemSchemas,
  assignmentSchemas,
  paymentSchemas,
  activitySchemas
} from './utils/validation.js';

export {
  calculateBillTotals,
  calculateItemAssignments,
  calculateParticipantBalances,
  formatCurrency,
  generateId,
  sanitizeInput,
  deepClone,
  isValidHangoutDate,
  calculateDistance,
  paginateResults,
  retryOperation
} from './utils/helpers.js';

/**
 * Convenience function to initialize all services at once
 * @param {string} accessToken - User's Supabase access token
 * @returns {Object} Object containing all initialized services
 */
export const initializeServices = (accessToken) => {
  if (!accessToken) {
    throw new Error('Access token is required to initialize services');
  }

  return {
    userService: new UserService(accessToken),
    hangoutService: new HangoutService(accessToken),
    billService: new BillService(accessToken),
    paymentService: new PaymentService(accessToken)
  };
};

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Environment configuration helper
 * @returns {Object} Current environment configuration status
 */
export const getEnvironmentInfo = () => {
  return {
    version: VERSION,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };
};

/**
 * Health check function for backend services
 * @param {string} accessToken - User's access token
 * @returns {Promise<Object>} Health check results
 */
export const healthCheck = async (accessToken) => {
  try {
    const services = initializeServices(accessToken);
    
    // Test basic connectivity by getting environment info
    const envInfo = getEnvironmentInfo();
    
    // Test Supabase connectivity (basic auth check)
    const testUser = await services.userService.userModel.supabase.auth.getUser();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: VERSION,
      environment: envInfo,
      supabase_connection: testUser.error ? 'error' : 'connected',
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
      version: VERSION,
      error: error.message,
      services: {
        user_service: 'unavailable',
        hangout_service: 'unavailable',
        bill_service: 'unavailable',
        payment_service: 'unavailable'
      }
    };
  }
};

// Default export for convenience
export default {
  // Services
  UserService,
  HangoutService,
  BillService,
  PaymentService,
  
  // Utilities
  initializeServices,
  healthCheck,
  getEnvironmentInfo,
  
  // Constants
  VERSION
};

import { createClient } from '@supabase/supabase-js';

// Check if we're in React Native environment
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

/**
 * Supabase client configuration and helper functions
 */

// Environment variables validation
const validateEnvironment = () => {
  // Try different environment variable patterns for React Native compatibility
  const supabaseUrl = 
    process.env.SUPABASE_URL || 
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.REACT_NATIVE_SUPABASE_URL;
    
  const supabaseAnonKey = 
    process.env.SUPABASE_ANON_KEY || 
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.REACT_NATIVE_SUPABASE_ANON_KEY;

  const requiredVars = {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey
  };

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(`⚠️ Backend services: Missing environment variables: ${missing.join(', ')}`);
    console.warn('📝 This is expected in React Native. Backend will use the app\'s Supabase client.');
    // Don't throw error - let React Native app handle Supabase configuration
    return null;
  }

  return requiredVars;
};

// Validate environment on import
const env = validateEnvironment();

/**
 * Create Supabase client with user authentication
 * @param {string} accessToken - User's access token from Supabase Auth
 * @param {Object} supabaseConfig - Optional Supabase config (for React Native)
 * @returns {Object} Authenticated Supabase client
 */
export const createAuthenticatedClient = (accessToken, supabaseConfig = null) => {
  if (!accessToken) {
    throw new Error('Access token is required for authenticated operations');
  }

  // If no environment config, require supabaseConfig parameter
  if (!env && !supabaseConfig) {
    throw new Error(
      'Supabase configuration required. Either set environment variables or pass supabaseConfig parameter.'
    );
  }

  const config = env || supabaseConfig;
  
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Create anonymous Supabase client (for public operations)
 * @param {Object} supabaseConfig - Optional Supabase config (for React Native)
 * @returns {Object} Anonymous Supabase client
 */
export const createAnonymousClient = (supabaseConfig = null) => {
  // If no environment config, require supabaseConfig parameter
  if (!env && !supabaseConfig) {
    throw new Error(
      'Supabase configuration required. Either set environment variables or pass supabaseConfig parameter.'
    );
  }

  const config = env || supabaseConfig;
  
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Database query helper with error handling
 * @param {Promise} queryBuilder - Supabase query builder promise
 * @param {string} operation - Description of the operation for error messages
 * @returns {Promise<any>} Query result data
 * @throws {Error} Database error with context
 */
export const executeQuery = async (queryBuilder, operation = 'database operation') => {
  try {
    const { data, error } = await queryBuilder;
    
    if (error) {
      console.error(`Database error during ${operation}:`, error);
      throw new Error(`Failed to execute ${operation}: ${error.message}`);
    }
    
    return data;
  } catch (err) {
    if (err.message.includes('Failed to execute')) {
      throw err;
    }
    console.error(`Query execution error during ${operation}:`, err);
    throw new Error(`Database operation failed: ${err.message}`);
  }
};

/**
 * Check if user exists and is active
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID to check
 * @returns {Promise<Object|null>} User data or null if not found
 */
export const getUserById = async (supabase, userId) => {
  return executeQuery(
    supabase
      .from('users')
      .select('id, email, username, full_name, avatar_url, created_at, last_login')
      .eq('id', userId)
      .single(),
    'get user by ID'
  );
};

/**
 * Check if user is a participant in a hangout
 * @param {Object} supabase - Supabase client
 * @param {string} hangoutId - Hangout ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user is an active participant
 */
export const isHangoutParticipant = async (supabase, hangoutId, userId) => {
  try {
    const data = await executeQuery(
      supabase
        .from('hangout_participants')
        .select('id')
        .eq('hangout_id', hangoutId)
        .eq('user_id', userId)
        .eq('participation_status', 'active')
        .single(),
      'check hangout participation'
    );
    return !!data;
  } catch (error) {
    // If no participant found, return false instead of throwing
    if (error.message.includes('No rows returned')) {
      return false;
    }
    throw error;
  }
};

/**
 * Check if user is the creator of a hangout
 * @param {Object} supabase - Supabase client
 * @param {string} hangoutId - Hangout ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user is the creator
 */
export const isHangoutCreator = async (supabase, hangoutId, userId) => {
  try {
    const data = await executeQuery(
      supabase
        .from('hangouts')
        .select('id')
        .eq('id', hangoutId)
        .eq('created_by', userId)
        .single(),
      'check hangout creator'
    );
    return !!data;
  } catch (error) {
    if (error.message.includes('No rows returned')) {
      return false;
    }
    throw error;
  }
};

/**
 * Log activity for hangout timeline
 * @param {Object} supabase - Supabase client
 * @param {string} hangoutId - Hangout ID
 * @param {string} userId - User ID performing the action
 * @param {string} activityType - Type of activity
 * @param {Object} activityData - Additional activity data
 * @returns {Promise<Object>} Created activity record
 */
export const logHangoutActivity = async (supabase, hangoutId, userId, activityType, activityData = {}) => {
  return executeQuery(
    supabase
      .from('hangout_activities')
      .insert({
        hangout_id: hangoutId,
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData
      })
      .select()
      .single(),
    'log hangout activity'
  );
};

export default {
  createAuthenticatedClient,
  createAnonymousClient,
  executeQuery,
  getUserById,
  isHangoutParticipant,
  isHangoutCreator,
  logHangoutActivity
};

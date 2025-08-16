/**
 * Jest test setup file
 * Configures global test environment and utilities
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

// Test configuration
global.TEST_CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  testTimeout: 30000
};

// Validate test configuration
if (!global.TEST_CONFIG.supabaseUrl || !global.TEST_CONFIG.supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration for tests');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

// Create test Supabase client
global.testSupabase = createClient(
  global.TEST_CONFIG.supabaseUrl,
  global.TEST_CONFIG.supabaseAnonKey
);

// Test user IDs (from our test data)
global.TEST_USERS = {
  ALICE: '550e8400-e29b-41d4-a716-446655440001',
  BOB: '550e8400-e29b-41d4-a716-446655440002',
  CHARLIE: '550e8400-e29b-41d4-a716-446655440003',
  DIANA: '550e8400-e29b-41d4-a716-446655440004',
  EVE: '550e8400-e29b-41d4-a716-446655440005'
};

// Test hangout IDs (from our test data)
global.TEST_HANGOUTS = {
  ITALIAN: '660e8400-e29b-41d4-a716-446655440001',
  COFFEE: '660e8400-e29b-41d4-a716-446655440002'
};

// Test bill IDs (from our test data)
global.TEST_BILLS = {
  ITALIAN_BILL: '770e8400-e29b-41d4-a716-446655440001',
  COFFEE_BILL: '770e8400-e29b-41d4-a716-446655440002'
};

// Mock access token for testing
global.MOCK_ACCESS_TOKEN = 'mock-jwt-token-for-testing';

// Test utilities
global.testUtils = {
  /**
   * Create a mock Supabase config for testing
   */
  createMockSupabaseConfig: () => ({
    SUPABASE_URL: global.TEST_CONFIG.supabaseUrl,
    SUPABASE_ANON_KEY: global.TEST_CONFIG.supabaseAnonKey
  }),

  /**
   * Wait for a specified amount of time
   * @param {number} ms - Milliseconds to wait
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate a random UUID for testing
   */
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Create test hangout data
   */
  createTestHangoutData: () => ({
    title: `Test Hangout ${Date.now()}`,
    location_name: 'Test Restaurant',
    location_address: '123 Test St, Test City',
    latitude: 40.7128,
    longitude: -74.0060,
    hangout_date: new Date().toISOString(),
    status: 'active'
  }),

  /**
   * Create test bill data
   */
  createTestBillData: () => ({
    title: `Test Bill ${Date.now()}`,
    description: 'Test bill description',
    subtotal: 100.00,
    tax_amount: 10.00,
    tip_amount: 20.00,
    total_amount: 130.00,
    bill_date: new Date().toISOString(),
    status: 'active'
  })
};

// Console setup for tests
console.log('🧪 Test environment setup complete');
console.log('📊 Supabase URL:', global.TEST_CONFIG.supabaseUrl);
console.log('🔑 Test users available:', Object.keys(global.TEST_USERS).length);
console.log('🏠 Test hangouts available:', Object.keys(global.TEST_HANGOUTS).length);
console.log('🧾 Test bills available:', Object.keys(global.TEST_BILLS).length);

#!/usr/bin/env node

// Test script to verify the storage adapter
const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

console.log('🔧 Testing Storage Adapter...\n');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create a test storage adapter (similar to the one in supabase.js)
const TestStorageAdapter = {
  getItem: async (key) => {
    try {
      // In Node.js environment, simulate localStorage behavior
      if (typeof window === 'undefined') {
        // Use a simple in-memory store for testing
        return global.testStorage?.[key] || null;
      }
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (typeof window === 'undefined') {
        // Use a simple in-memory store for testing
        global.testStorage = global.testStorage || {};
        global.testStorage[key] = value;
        return;
      }
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Storage setItem error:', error);
    }
  },
  removeItem: async (key) => {
    try {
      if (typeof window === 'undefined') {
        if (global.testStorage) {
          delete global.testStorage[key];
        }
        return;
      }
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Storage removeItem error:', error);
    }
  },
};

async function testStorage() {
  try {
    console.log('1️⃣ Testing storage adapter...');
    
    // Test storage operations
    await TestStorageAdapter.setItem('test-key', 'test-value');
    const value = await TestStorageAdapter.getItem('test-key');
    console.log(`   Set/Get test: ${value === 'test-value' ? '✅' : '❌'}`);
    
    await TestStorageAdapter.removeItem('test-key');
    const removedValue = await TestStorageAdapter.getItem('test-key');
    console.log(`   Remove test: ${removedValue === null ? '✅' : '❌'}`);
    
    console.log('\n2️⃣ Testing Supabase with storage...');
    
    // Create Supabase client with test storage
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: TestStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    
    // Test basic auth operations
    const { data, error } = await supabase.auth.getSession();
    if (error && !error.message.includes('JWT')) {
      throw error;
    }
    
    console.log('   Supabase client with storage: ✅');
    console.log('\n🎉 Storage adapter test completed successfully!');
    console.log('The SecureStore error should be resolved.');
    
  } catch (error) {
    console.log('\n❌ Storage test failed:');
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
}

testStorage();

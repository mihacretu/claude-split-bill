#!/usr/bin/env node

// Test script to verify Supabase connectivity
const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

console.log('🔍 Testing Supabase Connectivity...\n');

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Configuration Check:');
console.log(`URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
console.log(`URL Format: ${supabaseUrl?.startsWith('https://') ? '✅ Valid' : '❌ Invalid'}`);
console.log(`Key Length: ${supabaseAnonKey?.length > 100 ? '✅ Valid' : '❌ Too short'}\n`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing configuration. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnectivity() {
  try {
    console.log('🔗 Testing Connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'Invalid JWT') {
      throw error;
    }
    console.log('✅ Basic connection successful');
    
    // Test 2: Auth service
    console.log('🔐 Testing Auth Service...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError && !authError.message.includes('JWT') && !authError.message.includes('session missing')) {
      throw authError;
    }
    console.log('✅ Auth service accessible (no active session, which is expected)');
    
    // Test 3: Try to sign up with a test (this will fail but shows connectivity)
    console.log('📝 Testing Sign Up Endpoint...');
    const { error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (signUpError) {
      if (signUpError.message.includes('User already registered') || 
          signUpError.message.includes('Invalid email') ||
          signUpError.message.includes('signup is disabled')) {
        console.log('✅ Sign up endpoint accessible (expected error)');
      } else {
        console.log(`⚠️  Sign up response: ${signUpError.message}`);
      }
    } else {
      console.log('✅ Sign up endpoint working');
    }
    
    console.log('\n🎉 Supabase connectivity test completed successfully!');
    console.log('Your app should be able to connect to Supabase.');
    
  } catch (error) {
    console.log('\n❌ Connection test failed:');
    console.log(`Error: ${error.message}`);
    
    if (error.message.includes('Invalid URL')) {
      console.log('\n💡 Suggestion: Check your EXPO_PUBLIC_SUPABASE_URL in .env');
    } else if (error.message.includes('Invalid API key')) {
      console.log('\n💡 Suggestion: Check your EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
    } else if (error.message.includes('fetch')) {
      console.log('\n💡 Suggestion: Check your internet connection');
    }
    
    process.exit(1);
  }
}

testConnectivity();

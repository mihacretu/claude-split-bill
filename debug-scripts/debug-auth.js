#!/usr/bin/env node

// Debug script to test authentication with detailed error information
const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

console.log('🔍 Debugging Supabase Authentication...\n');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAuth() {
  try {
    console.log('📧 Testing with a real email format...');
    
    // Test 1: Try to sign up a user first
    const testEmail = 'test@gmail.com';
    const testPassword = 'TestPassword123!';
    
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    
    console.log('\n1️⃣ Attempting Sign Up (to create user)...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      console.log(`Sign up error: ${signUpError.message}`);
      if (signUpError.message.includes('User already registered')) {
        console.log('✅ User already exists - good for sign in test');
      } else if (signUpError.message.includes('signup is disabled')) {
        console.log('⚠️  Sign up is disabled. Let me check sign in with existing user...');
      } else {
        console.log('⚠️  Sign up issue:', signUpError.message);
      }
    } else {
      console.log('✅ Sign up successful');
      console.log('User:', signUpData.user?.email);
      console.log('Confirmed:', signUpData.user?.email_confirmed_at ? 'Yes' : 'No');
    }
    
    // Test 2: Try to sign in
    console.log('\n2️⃣ Attempting Sign In...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError) {
      console.log('❌ Sign in failed:');
      console.log(`   Error: ${signInError.message}`);
      console.log(`   Status: ${signInError.status || 'Unknown'}`);
      
      // Provide specific guidance based on error
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('\n💡 This usually means:');
        console.log('   - User doesn\'t exist, OR');
        console.log('   - Password is wrong, OR');
        console.log('   - Email confirmation is required but not completed');
      } else if (signInError.message.includes('Email not confirmed')) {
        console.log('\n💡 Email confirmation required:');
        console.log('   - Check your Supabase Auth settings');
        console.log('   - Disable email confirmation for testing');
      } else if (signInError.message.includes('signup is disabled')) {
        console.log('\n💡 Sign up is disabled in your Supabase project');
        console.log('   - Go to Authentication > Settings');
        console.log('   - Enable "Enable email signups"');
      }
    } else {
      console.log('✅ Sign in successful!');
      console.log('User:', signInData.user?.email);
      console.log('Session:', signInData.session ? 'Created' : 'None');
    }
    
    // Test 3: Check project settings
    console.log('\n3️⃣ Checking Auth Configuration...');
    console.log('   Project URL:', supabaseUrl);
    console.log('   Using email/password auth: ✅');
    
  } catch (error) {
    console.log('\n❌ Debug failed:');
    console.log(`Error: ${error.message}`);
  }
}

debugAuth();

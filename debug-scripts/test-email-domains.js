#!/usr/bin/env node

// Test script to check what email domains are allowed
const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

console.log('📧 Testing Email Domain Restrictions...\n');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmailDomains() {
  const testEmails = [
    'test@gmail.com',
    'user@hotmail.com', 
    'person@yahoo.com',
    'demo@outlook.com',
    'test@example.com',
    'valid@supabase.io',
    'admin@localhost',
  ];

  console.log('🔍 Testing different email domains...\n');

  for (const email of testEmails) {
    try {
      console.log(`Testing: ${email}`);
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'TestPassword123!',
      });
      
      if (error) {
        console.log(`   ❌ ${error.message}`);
        
        if (error.message.includes('Email address') && error.message.includes('invalid')) {
          console.log('      → Domain restriction likely in place');
        }
      } else {
        console.log(`   ✅ Success - ${data.user ? 'User created' : 'Request accepted'}`);
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('💡 Recommendations:');
  console.log('   1. Check your Supabase Auth settings for email domain restrictions');
  console.log('   2. Go to Authentication > Settings in your Supabase dashboard');
  console.log('   3. Look for "Email Domain Allowlist" or similar settings');
  console.log('   4. Add your test domains or disable domain restrictions for development');
  console.log('   5. For production, consider using real email addresses from allowed domains');
}

testEmailDomains();

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get Supabase credentials from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are properly configured
if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url_here' || !supabaseUrl.startsWith('https://')) {
  throw new Error(
    '❌ Supabase URL is not configured properly!\n\n' +
    '🔧 Please follow these steps:\n' +
    '1. Go to https://app.supabase.com/\n' +
    '2. Create a new project or select existing one\n' +
    '3. Go to Settings > API\n' +
    '4. Copy your Project URL\n' +
    '5. Add it to your .env file as EXPO_PUBLIC_SUPABASE_URL=your_url_here\n\n' +
    '📖 See .env.example for the correct format'
  );
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here' || supabaseAnonKey.length < 100) {
  throw new Error(
    '❌ Supabase Anon Key is not configured properly!\n\n' +
    '🔧 Please follow these steps:\n' +
    '1. Go to https://app.supabase.com/\n' +
    '2. Select your project\n' +
    '3. Go to Settings > API\n' +
    '4. Copy your anon/public key\n' +
    '5. Add it to your .env file as EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here\n\n' +
    '📖 See .env.example for the correct format'
  );
}

// Custom storage implementation for Expo
const ExpoSecureStoreAdapter = {
  getItem: async (key) => {
    try {
      // Check if we're in a web environment
      if (Platform.OS === 'web' || typeof window !== 'undefined') {
        // Use localStorage for web
        return localStorage.getItem(key);
      }
      // Use SecureStore for native (iOS/Android)
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('Storage getItem error:', error);
      // Fallback to localStorage if SecureStore fails
      if (typeof window !== 'undefined') {
        try {
          return localStorage.getItem(key);
        } catch (fallbackError) {
          console.warn('LocalStorage fallback failed:', fallbackError);
        }
      }
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      // Check if we're in a web environment
      if (Platform.OS === 'web' || typeof window !== 'undefined') {
        // Use localStorage for web
        localStorage.setItem(key, value);
        return;
      }
      // Use SecureStore for native (iOS/Android)
      return await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('Storage setItem error:', error);
      // Fallback to localStorage if SecureStore fails
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, value);
        } catch (fallbackError) {
          console.warn('LocalStorage fallback failed:', fallbackError);
        }
      }
    }
  },
  removeItem: async (key) => {
    try {
      // Check if we're in a web environment
      if (Platform.OS === 'web' || typeof window !== 'undefined') {
        // Use localStorage for web
        localStorage.removeItem(key);
        return;
      }
      // Use SecureStore for native (iOS/Android)
      return await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('Storage removeItem error:', error);
      // Fallback to localStorage if SecureStore fails
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(key);
        } catch (fallbackError) {
          console.warn('LocalStorage fallback failed:', fallbackError);
        }
      }
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

// Try to import supabase, but handle configuration errors gracefully
let supabase = null;
let supabaseConfigError = null;

try {
  supabase = require('../config/supabase').supabase;
} catch (error) {
  supabaseConfigError = error.message;
  console.warn('⚠️ Supabase configuration error:', error.message);
}

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase is not configured, show error and set loading to false
    if (!supabase) {
      setLoading(false);
      // Show configuration error after a brief delay
      setTimeout(() => {
        Alert.alert(
          '⚙️ Supabase Configuration Required',
          supabaseConfigError || 'Supabase is not configured properly.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('📖 Please check src/config/supabase-setup.md for setup instructions');
              },
            },
          ]
        );
      }, 1000);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign up with email and password
  const signUp = async (email, password, options = {}) => {
    if (!supabase) {
      return { 
        data: null, 
        error: { message: 'Supabase is not configured. Please check your configuration.' } 
      };
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    if (!supabase) {
      return { 
        data: null, 
        error: { message: 'Supabase is not configured. Please check your configuration.' } 
      };
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    if (!supabase) {
      console.log('SignOut failed: Supabase not configured');
      return { error: { message: 'Supabase is not configured.' } };
    }

    try {
      console.log('Starting signOut process...');
      setLoading(true);
      
      // Clear local state first
      console.log('Clearing local auth state...');
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('SignOut error from Supabase:', error);
        throw error;
      }
      console.log('SignOut successful - Supabase auth.signOut() completed');
      return { error: null };
    } catch (error) {
      console.log('SignOut exception:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    if (!supabase) {
      return { 
        data: null, 
        error: { message: 'Supabase is not configured. Please check your configuration.' } 
      };
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Resend confirmation email
  const resendConfirmation = async (email) => {
    if (!supabase) {
      return { 
        data: null, 
        error: { message: 'Supabase is not configured. Please check your configuration.' } 
      };
    }

    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    resendConfirmation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AuthInput, AuthButton, BackButton } from '../components';
import { useAuth } from '../context/AuthContext';
import Colors from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const { signIn, loading } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const { data, error } = await signIn(email.trim(), password);

    if (error) {
      // Check if the error is related to email confirmation
      if (error.message.includes('Email not confirmed')) {
        Alert.alert(
          'Email Confirmation Required',
          'Please check your email and click the confirmation link before signing in. If you haven\'t received the email, you can request a new one.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Resend Email', 
              onPress: () => navigation.navigate('EmailConfirmationScreen', { 
                email: email.trim(),
                isSignUp: false 
              })
            },
          ]
        );
      } else if (error.message.includes('Invalid login credentials')) {
        Alert.alert(
          'Login Failed',
          'Invalid email or password. Please check your credentials or confirm your email address if you haven\'t already.',
          [
            { text: 'OK' },
            { 
              text: 'Need Confirmation?', 
              onPress: () => navigation.navigate('EmailConfirmationScreen', { 
                email: email.trim(),
                isSignUp: false 
              })
            },
          ]
        );
      } else {
        Alert.alert(
          'Login Failed',
          error.message || 'An error occurred during login',
          [{ text: 'OK' }]
        );
      }
    } else if (data?.user) {
      // Navigation will be handled by the auth state change
      console.log('Login successful');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPasswordScreen');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUpScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[Colors.backgroundTop, Colors.backgroundMid, Colors.backgroundBottom]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <BackButton onPress={() => navigation.goBack()} />
            
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue splitting bills with friends</Text>
            </View>

            <View style={styles.form}>
              <AuthInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <AuthInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                error={errors.password}
              />

              <AuthButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.signInButton}
              />

              <AuthButton
                title="Forgot Password?"
                onPress={handleForgotPassword}
                variant="ghost"
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <AuthButton
                title="Sign Up"
                onPress={handleSignUp}
                variant="ghost"
                style={styles.signUpButton}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textOnLightPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textOnLightSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  signInButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: Colors.textOnLightSecondary,
    marginBottom: 8,
  },
  signUpButton: {
    marginTop: -8,
  },
});

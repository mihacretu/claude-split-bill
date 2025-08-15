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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    const { data, error } = await resetPassword(email.trim());

    if (error) {
      Alert.alert(
        'Reset Failed',
        error.message || 'An error occurred while sending reset email',
        [{ text: 'OK' }]
      );
    } else {
      setIsSubmitted(true);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('LoginScreen');
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <LinearGradient
          colors={[Colors.backgroundTop, Colors.backgroundMid, Colors.backgroundBottom]}
          style={styles.gradient}
        >
          <View style={styles.successContainer}>
            <BackButton onPress={() => navigation.goBack()} />
            
            <View style={styles.successContent}>
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successSubtitle}>
                We've sent a password reset link to {email}
              </Text>
              <Text style={styles.successDescription}>
                Click the link in the email to reset your password. If you don't see the email, check your spam folder.
              </Text>
              
              <AuthButton
                title="Back to Sign In"
                onPress={handleBackToLogin}
                style={styles.backButton}
              />
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you a link to reset your password
              </Text>
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

              <AuthButton
                title="Send Reset Link"
                onPress={handleResetPassword}
                style={styles.resetButton}
              />

              <AuthButton
                title="Back to Sign In"
                onPress={handleBackToLogin}
                variant="ghost"
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
  resetButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textOnLightPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 18,
    color: Colors.textOnLightPrimary,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  successDescription: {
    fontSize: 16,
    color: Colors.textOnLightSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  backButton: {
    marginTop: 20,
  },
});

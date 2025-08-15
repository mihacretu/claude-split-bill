import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthButton, BackButton } from '../components';
import { useAuth } from '../context/AuthContext';
import Colors from '../theme/colors';

export default function EmailConfirmationScreen({ navigation, route }) {
  const { email, isSignUp } = route.params || {};
  const { resendConfirmation, user, session } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [lastResendTime, setLastResendTime] = useState(null);

  // Check if user gets confirmed automatically
  useEffect(() => {
    if (user && session) {
      // User is now authenticated, navigate to main app
      navigation.navigate('HomeScreen');
    }
  }, [user, session, navigation]);

  // Listen for app state changes to check if user came back from email
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // App became active, user might have clicked email link
        // The auth context will handle the session update automatically
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const handleResendEmail = async () => {
    if (!email) return;

    // Rate limiting: don't allow resending too frequently
    const now = Date.now();
    if (lastResendTime && (now - lastResendTime) < 60000) { // 1 minute
      const remainingTime = Math.ceil((60000 - (now - lastResendTime)) / 1000);
      Alert.alert(
        'Please Wait',
        `You can request another email in ${remainingTime} seconds.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsResending(true);

    try {
      const { data, error } = await resendConfirmation(email);

      if (error) {
        Alert.alert(
          'Resend Failed',
          error.message || 'Failed to resend confirmation email',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Confirmation Email Sent',
          'We\'ve sent a new confirmation email to your inbox. Please check your email and click the link to verify your account.',
          [{ text: 'OK' }]
        );
        setResendCount(prev => prev + 1);
        setLastResendTime(now);
      }
    } catch (error) {
      Alert.alert(
        'Resend Failed',
        'An error occurred while resending the email. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('LoginScreen');
  };

  const handleBackToSignUp = () => {
    navigation.navigate('SignUpScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[Colors.backgroundTop, Colors.backgroundMid, Colors.backgroundBottom]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <BackButton onPress={() => navigation.goBack()} />
          
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={80} color={Colors.accentBlue} />
            </View>

            <Text style={styles.title}>Check Your Email</Text>
            
            <Text style={styles.subtitle}>
              We've sent a confirmation link to:
            </Text>
            
            <Text style={styles.email}>{email}</Text>
            
            <Text style={styles.description}>
              {isSignUp 
                ? 'Please click the link in the email to activate your account and complete your registration.'
                : 'Please click the link in the email to confirm your account before signing in.'
              }
            </Text>

            <View style={styles.instructionsContainer}>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.accentBlue} />
                <Text style={styles.instructionText}>Check your inbox and spam folder</Text>
              </View>
              
              <View style={styles.instructionItem}>
                <Ionicons name="link-outline" size={20} color={Colors.accentBlue} />
                <Text style={styles.instructionText}>Click the confirmation link</Text>
              </View>
              
              <View style={styles.instructionItem}>
                <Ionicons name="return-up-back-outline" size={20} color={Colors.accentBlue} />
                <Text style={styles.instructionText}>Return to the app to sign in</Text>
              </View>
            </View>

            <AuthButton
              title={isResending ? "Sending..." : "Resend Email"}
              onPress={handleResendEmail}
              loading={isResending}
              variant="secondary"
              style={styles.resendButton}
            />

            {resendCount > 0 && (
              <Text style={styles.resendNote}>
                Email sent {resendCount} time{resendCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>

          <View style={styles.footer}>
            <AuthButton
              title={isSignUp ? "Back to Sign Up" : "Back to Sign In"}
              onPress={isSignUp ? handleBackToSignUp : handleBackToLogin}
              variant="ghost"
            />
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textOnLightPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textOnLightSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.accentBlue,
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: Colors.textOnLightSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  instructionsContainer: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textOnLightPrimary,
    marginLeft: 12,
    flex: 1,
  },
  resendButton: {
    marginBottom: 16,
  },
  resendNote: {
    fontSize: 12,
    color: Colors.textOnLightSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
});

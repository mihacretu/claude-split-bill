import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { 
  TestNavigationScreen, 
  SplitScreen, 
  ChooseYoursScreen, 
  HomeScreen, 
  BillDetailsScreen,
  LoginScreen,
  SignUpScreen,
  ForgotPasswordScreen,
  EmailConfirmationScreen
} from './src/screens';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { setupBackendAuthListener } from './lib/backend-integration';

// Main authenticated app component
function AuthenticatedApp() {
  const [currentScreen, setCurrentScreen] = useState('HomeScreen');
  const [currentParams, setCurrentParams] = useState(null);

  // Simple navigation object with params support
  const navigation = {
    navigate: (screenName, params) => {
      setCurrentParams(params || null);
      setCurrentScreen(screenName);
    },
    goBack: () => {
      setCurrentParams(null);
      setCurrentScreen('HomeScreen');
    }
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'HomeScreen':
        return <HomeScreen navigation={navigation} />;
      case 'SplitScreen':
        return <SplitScreen navigation={navigation} />;
      case 'ChooseYoursScreen':
        return <ChooseYoursScreen navigation={navigation} />;
      case 'BillDetailsScreen':
        return <BillDetailsScreen navigation={navigation} bill={currentParams?.bill} />;
      default:
        return <TestNavigationScreen navigation={navigation} />;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'transparent', overflow: 'hidden' }}>
      {renderCurrentScreen()}
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

// Unauthenticated app component
function UnauthenticatedApp() {
  const [currentScreen, setCurrentScreen] = useState('LoginScreen');
  const [currentParams, setCurrentParams] = useState(null);

  // Simple navigation object with params support
  const navigation = {
    navigate: (screenName, params) => {
      setCurrentParams(params || null);
      setCurrentScreen(screenName);
    },
    goBack: () => {
      setCurrentParams(null);
      setCurrentScreen('LoginScreen');
    }
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'LoginScreen':
        return <LoginScreen navigation={navigation} />;
      case 'SignUpScreen':
        return <SignUpScreen navigation={navigation} />;
      case 'ForgotPasswordScreen':
        return <ForgotPasswordScreen navigation={navigation} />;
      case 'EmailConfirmationScreen':
        return <EmailConfirmationScreen navigation={navigation} route={{ params: currentParams }} />;
      default:
        return <LoginScreen navigation={navigation} />;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'transparent', overflow: 'hidden' }}>
      {renderCurrentScreen()}
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

// App router component that decides between authenticated and unauthenticated flows
function AppRouter() {
  const { user, loading } = useAuth();

  console.log('AppRouter - User:', user ? 'Authenticated' : 'Not authenticated', 'Loading:', loading);

  if (loading) {
    console.log('AppRouter - Showing loading state');
    // You can create a loading screen component here if needed
    return null;
  }

  const showAuthenticatedApp = user ? true : false;
  console.log('AppRouter - Showing:', showAuthenticatedApp ? 'AuthenticatedApp' : 'UnauthenticatedApp');

  return showAuthenticatedApp ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

// Main App component with AuthProvider
export default function App() {
  // Initialize backend auth listener on app start
  useEffect(() => {
    console.log('🚀 Initializing Claude Split Bill App');
    setupBackendAuthListener();
    console.log('✅ Backend auth listener setup complete');
  }, []);

  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

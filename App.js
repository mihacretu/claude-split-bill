import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TestNavigationScreen, SplitScreen, ChooseYoursScreen, HomeScreen, BillDetailsScreen } from './src/screens';

export default function App() {
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

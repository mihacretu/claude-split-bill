import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TestNavigationScreen, SplitScreen, ChooseYoursScreen } from './src/screens';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('TestNavigation');

  // Simple navigation object
  const navigation = {
    navigate: (screenName) => setCurrentScreen(screenName),
    goBack: () => setCurrentScreen('TestNavigation')
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'SplitScreen':
        return <SplitScreen navigation={navigation} />;
      case 'ChooseYoursScreen':
        return <ChooseYoursScreen navigation={navigation} />;
      default:
        return <TestNavigationScreen navigation={navigation} />;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F2F4F7' }}>
      {renderCurrentScreen()}
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

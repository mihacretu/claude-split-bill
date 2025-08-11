import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TestNavigationScreen, SplitScreen, ChooseYoursScreen, HomeScreen } from './src/screens';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('HomeScreen');

  // Simple navigation object
  const navigation = {
    navigate: (screenName) => setCurrentScreen(screenName),
    goBack: () => setCurrentScreen('TestNavigation')
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'HomeScreen':
        return <HomeScreen navigation={navigation} />;
      case 'SplitScreen':
        return <SplitScreen navigation={navigation} />;
      case 'ChooseYoursScreen':
        return <ChooseYoursScreen navigation={navigation} />;
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

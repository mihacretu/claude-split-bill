import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SplitScreen from './src/screens/SplitScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F2F4F7' }}>
      <SplitScreen />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

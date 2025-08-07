import { StatusBar } from 'expo-status-bar';
import SplitScreen from './src/screens/SplitScreen';

export default function App() {
  return (
    <>
      <SplitScreen />
      <StatusBar style="auto" />
    </>
  );
}

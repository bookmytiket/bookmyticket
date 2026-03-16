import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ConvexClientProvider } from './src/context/ConvexProvider';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ConvexClientProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </ConvexClientProvider>
  );
}

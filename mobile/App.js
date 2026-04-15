import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { ConfirmProvider } from './src/context/ConfirmContext';
import Toast from './src/components/Toast';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Toast />
          <AppNavigator />
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

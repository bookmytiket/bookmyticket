import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';

export default function OrganiserLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  
  // Guard: Only allow organisers or admins
  if (!user || (user.role !== 'organiser' && user.role !== 'admin')) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTintColor: '#0f172a',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerShadowVisible: false,
    }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Organiser Dashboard',
          headerTitleAlign: 'center',
        }} 
      />
      <Stack.Screen 
        name="scanner" 
        options={{ 
          title: 'Scan QR Code',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

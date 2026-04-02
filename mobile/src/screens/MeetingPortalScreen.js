import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function MeetingPortalScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleJoin = () => {
    if (code.length !== 9) {
      Alert.alert('Invalid Code', 'Please enter a valid 9-digit meeting code.');
      return;
    }
    
    // In a real app, we might verify the code here, 
    // but we'll pass it to the Waiting Room which handles the query.
    navigation.navigate('MeetingWaitingRoom', { meetingCode: code });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0f1e', '#1a233a']}
        style={StyleSheet.absoluteFill}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="videocam" size={40} color="#3b82f6" />
          </View>
          <Text style={styles.title}>Join Meeting</Text>
          <Text style={styles.subtitle}>Enter the 9-digit code provided to you</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="000 000 000"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="number-pad"
            maxLength={9}
            value={code}
            onChangeText={setCode}
            autoFocus
          />
          <Text style={styles.helperText}>
            {code.length}/9 digits entered
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.joinButton, code.length !== 9 && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={code.length !== 9 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.joinButtonText}>Enter Waiting Room</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.4)" />
          <Text style={styles.footerText}>Secure End-to-End Encrypted Session</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 24,
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    letterSpacing: 4,
  },
  helperText: {
    marginTop: 12,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  joinButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  joinButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    marginTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
});

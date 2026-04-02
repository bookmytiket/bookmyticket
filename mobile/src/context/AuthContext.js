import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';

const AuthContext = createContext();
console.log('!!!!!!! [CRITICAL] AUTH CONTEXT LOADED - VERSION 8 !!!!!!!');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');
  const convex = useConvex();

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedCity = await AsyncStorage.getItem('selectedCity');
      if (storedCity) setSelectedCity(storedCity);
    } catch (err) {
      console.error('Error loading stored user:', err);
      await AsyncStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const updateCity = useCallback(async (city) => {
    setSelectedCity(city);
    await AsyncStorage.setItem('selectedCity', city);
  }, []);

  const login = useCallback(async (identifier, password, manualRole, userData = null) => {
    // 1. Admin login remains local/hardcoded for now
    if (manualRole === 'admin') {
      if (identifier === 'bookmyticket-admin' && password === 'D0n+$h@rE2k26') {
        const mockUser = { identifier, role: 'admin', name: 'Master Admin' };
        setUser(mockUser);
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));
        return { success: true, role: 'admin' };
      }
      return { success: false, error: 'Invalid admin credentials' };
    }

    // 2. All other roles use the unified backend mutation
    try {
      console.log('[DEBUG] Attempting login for:', identifier);
      const result = await convex.mutation(api.auth.login, { identifier, password });
      console.log('[DEBUG] Login result object:', JSON.stringify(result));
      
      if (result && result.success) {
        if (result.needsOtp) {
          console.log('[DEBUG] OTP required for login');
          return { success: true, needsOtp: true, email: result.email };
        }

        if (result.role === 'organiser') {
          return { 
            success: false, 
            error: 'Please log in through the Web Portal. Mobile access is currently not available for organisers.' 
          };
        }

        // Extremely safe extraction of user data
        const userData = result.data || {};
        const authUser = { 
          identifier: identifier, 
          role: result.role || 'user', 
          name: userData.name || userData.fullName || 'User', 
          id: userData._id || 'unknown'
        };
        
        console.log('[DEBUG] Constructed authUser:', JSON.stringify(authUser));

        if (result.role === 'staff' && userData.organiserId) {
          authUser.organiserId = userData.organiserId;
        }

        setUser(authUser);
        await AsyncStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: authUser.role };
      }
      
      const errorMsg = result?.error || 'Invalid credentials';
      console.log('[DEBUG] Login failed:', errorMsg);
      return { success: false, error: errorMsg };
    } catch (err) {
      console.error('[DEBUG] Unified login CRITICAL error:', err);
      return { success: false, error: 'Network error or system failure' };
    }
  }, [convex]);

  const verifyLoginOTP = useCallback(async (email, code) => {
    try {
      console.log('[DEBUG] Verifying OTP for:', email);
      const result = await convex.mutation(api.auth.verifyLoginOTP, { email, code });
      console.log('[DEBUG] OTP Verification result:', JSON.stringify(result));
      
      if (result && result.success) {
        if (result.role === 'organiser') {
          return { 
            success: false, 
            error: 'Please log in through the Web Portal. Mobile access is currently not available for organisers.' 
          };
        }

        // Safe extraction of user data
        const userData = result.data || {};
        const authUser = { 
          identifier: email, 
          role: result.role || 'user', 
          name: userData.name || userData.fullName || 'User', 
          id: userData._id || 'unknown'
        };
        
        console.log('[DEBUG] OTP AuthUser created:', JSON.stringify(authUser));

        if (result.role === 'staff' && userData.organiserId) {
          authUser.organiserId = userData.organiserId;
        }

        setUser(authUser);
        await AsyncStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: authUser.role };
      }
      const errorMsg = result?.error || 'Verification failed';
      console.log('[DEBUG] OTP Verification failed:', errorMsg);
      return { success: false, error: errorMsg };
    } catch (err) {
      console.error('[DEBUG] OTP verification CRITICAL error:', err);
      return { success: false, error: 'Network error or invalid code' };
    }
  }, [convex]);

  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const addToRecentlyViewed = useCallback((event) => {
    if (!event) return;
    const eventId = String(event.id || event._id);
    setRecentlyViewed(prev => {
      // Guard: If the event is already the first one, don't update state to avoid render loops
      if (prev.length > 0 && String(prev[0].id) === eventId) {
        return prev;
      }
      
      const item = { 
        id: eventId, 
        title: event.title, 
        img: event.img || event.bannerPreview, 
        date: event.date, 
        location: event.location || event.venue || event.address,
        virtual: event.virtual
      };
      
      const filtered = prev.filter(e => String(e.id) !== eventId);
      return [item, ...filtered].slice(0, 10);
    });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    verifyLoginOTP,
    logout,
    loading,
    selectedCity,
    updateCity,
    recentlyViewed,
    addToRecentlyViewed
  }), [user, login, verifyLoginOTP, logout, loading, selectedCity, updateCity, recentlyViewed, addToRecentlyViewed]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

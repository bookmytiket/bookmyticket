import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';

const AuthContext = createContext();

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

    // 2. All other roles use the unified backend query
    try {
      const result = await convex.query(api.auth.login, { identifier, password });
      
      if (result.success) {
        let authUser = { 
          identifier, 
          role: result.role, 
          name: result.data.name, 
          id: result.data._id 
        };
        
        if (result.role === 'staff') {
          authUser.organiserId = result.data.organiserId;
        }

        setUser(authUser);
        await AsyncStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: result.role };
      }
      
      return { success: false, error: result.error };
    } catch (err) {
      console.error('Unified login error:', err);
      return { success: false, error: 'Network error or server unavailable' };
    }
  }, [convex]);

  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const addToRecentlyViewed = useCallback((event) => {
    if (!event) return;
    setRecentlyViewed(prev => {
      const item = { 
        id: event.id || event._id, 
        title: event.title, 
        img: event.img || event.bannerPreview, 
        date: event.date, 
        location: event.location || event.venue || event.address,
        virtual: event.virtual
      };
      const filtered = prev.filter(e => String(e.id) !== String(item.id));
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
    logout,
    loading,
    selectedCity,
    updateCity,
    recentlyViewed,
    addToRecentlyViewed
  }), [user, login, logout, loading, selectedCity, updateCity, recentlyViewed, addToRecentlyViewed]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const isServiceProvider = (category) => {
  if (!category) return false;
  const c = String(category).trim().toLowerCase();
  return c.includes("mehandi") || 
         c.includes("mehendi") || 
         c.includes("photograph") || 
         c.includes("makeup") || 
         c.includes("artist") || 
         c.includes("personal service");
};

const AuthContext = createContext();
console.log('!!!!!!! [CRITICAL] AUTH CONTEXT LOADED - VERSION 8 !!!!!!!');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');
  const [locationHierarchy, setLocationHierarchy] = useState(null);
  useEffect(() => {
    loadStoredUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        const authUser = {
          id: session.user.id,
          identifier: session.user.email,
          email: session.user.email,
          name: profile?.name || session.user.user_metadata?.name || 'User',
          role: profile?.role || 'user',
          category: profile?.category
        };
        setUser(authUser);
        await AsyncStorage.setItem('user', JSON.stringify(authUser));
      } else {
        setUser(null);
        await AsyncStorage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedCity = await AsyncStorage.getItem('selectedCity');
      if (storedCity) setSelectedCity(storedCity);
      const storedHierarchy = await AsyncStorage.getItem('locationHierarchy');
      if (storedHierarchy) setLocationHierarchy(JSON.parse(storedHierarchy));
    } catch (err) {
      console.error('Error loading stored user:', err);
      await AsyncStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const updateCity = useCallback(async (city, hierarchy = null) => {
    setSelectedCity(city);
    setLocationHierarchy(hierarchy);
    await AsyncStorage.setItem('selectedCity', city);
    if (hierarchy) {
      await AsyncStorage.setItem('locationHierarchy', JSON.stringify(hierarchy));
    } else {
      await AsyncStorage.removeItem('locationHierarchy');
    }

    // Sync with backend if user is logged in
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({
            city: city,
            location_hierarchy: hierarchy
          })
          .eq('id', user.id);
      } catch (err) {
        console.error('Failed to sync location to backend:', err);
      }
    }
  }, [user]);


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

    // 2. All other roles use Supabase Auth
    try {
      console.log('[DEBUG] Attempting login for:', identifier);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });

      if (error) throw error;
      
      const sessionUser = data.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (profile?.role === 'organiser') {
        if (!isServiceProvider(profile.category)) {
          return { 
            success: false, 
            error: 'Please log in through the Web Portal. Mobile access is currently not available for organisers.' 
          };
        }
      }

      const authUser = { 
        id: sessionUser.id,
        identifier: sessionUser.email, 
        role: profile?.role || 'user', 
        name: profile?.name || sessionUser.user_metadata?.name || 'User', 
        category: profile?.category
      };
      
      setUser(authUser);
      await AsyncStorage.setItem('user', JSON.stringify(authUser));
      return { success: true, role: authUser.role };
    } catch (err) {
      console.error('[DEBUG] Login error:', err);
      return { success: false, error: err.message || 'Invalid credentials' };
    }
  }, []);



  const verifyLoginOTP = useCallback(async (email, code) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });

      if (error) throw error;
      
      // Verification logic similar to login
      return { success: true };
    } catch (err) {
      console.error('[DEBUG] OTP error:', err);
      return { success: false, error: err.message };
    }
  }, []);

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
    await supabase.auth.signOut();
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
    locationHierarchy,
    updateCity,
    recentlyViewed,
    addToRecentlyViewed
  }), [user, login, verifyLoginOTP, logout, loading, selectedCity, locationHierarchy, updateCity, recentlyViewed, addToRecentlyViewed]);


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

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
  const [lastActivity, setLastActivity] = useState(Date.now());
  const inactivityTimerRef = React.useRef(null);
  useEffect(() => {
    loadStoredUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        const role = (profile?.role || 'user').toLowerCase();

        // Security check for organiser on auth state change: 
        // We allow them to stay logged in for public features, but skip setting professional state
        if (role === 'organiser') {
           // We used to sign out here, but it caused login loops. 
           // Now we just let them stay as a user but blocks professional screens later.
        }
          
        const authUser = {
          id: session.user.id,
          identifier: session.user.email,
          email: session.user.email,
          name: profile?.full_name || profile?.name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          role: role === 'user' ? 'public' : role,
          ...(profile || {}),
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

  // Inactivity Logout Logic (15 Minutes)
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minutes

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        console.log("[AuthContext] Mobile Inactivity timeout reached. Signing out...");
        logout();
      }, INACTIVITY_LIMIT);
    };

    // For mobile, we mainly track AppState changes as a proxy for activity
    // and reset the timer when the app comes to foreground or is active
    const subscription = require('react-native').AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        resetInactivityTimer();
      }
    });

    resetInactivityTimer(); // Initialize timer

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      subscription.remove();
    };
  }, [user, logout]);

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


  const login = useCallback(async (identifier, password, manualRole) => {
    // 1. Admin login remains local/hardcoded for now
    if (manualRole === 'admin') {
      if (identifier === 'bookmyticket-admin' && password === 'D0n+$h@rE2k26') {
        const mockUser = { id: 'admin-id', identifier, role: 'admin', name: 'Master Admin' };
        setUser(mockUser);
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));
        return { success: true, role: 'admin' };
      }
      return { success: false, error: 'Invalid admin credentials' };
    }

    // 2. All other roles use Supabase Auth
    try {
      console.log('[DEBUG] Attempting login for:', identifier);
      
      const trimmedIdentifier = identifier.trim();
      let email = trimmedIdentifier;
      // Handle username login by looking up email in profiles
      if (!trimmedIdentifier.includes('@')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', trimmedIdentifier)
          .single();
        
        if (profile?.email) {
          email = profile.email;
        } else {
          return { success: false, error: 'Invalid username or email' };
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      const sessionUser = data.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      const role = (profile?.role || 'user').toLowerCase();

      // Organisers are Web-Only for Management
      if (role === 'organiser') {
         // We allow login but inform them about platform restrictions if they try to access Management
      }

      const authUser = { 
        id: sessionUser.id,
        identifier: sessionUser.email, 
        role: role === 'user' ? 'public' : role,
        name: profile?.full_name || profile?.name || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User', 
        ...(profile || {}),
      };
      
      setUser(authUser);
      await AsyncStorage.setItem('user', JSON.stringify(authUser));
      return { success: true, role: authUser.role };
    } catch (err) {
      // console.error('[DEBUG] Login error:', err); // Suppress for cleaner UI
      // Simplify error message for user
      let msg = err.message || 'Invalid credentials';
      if (msg.includes('Invalid login credentials')) msg = 'Invalid email or password';
      return { success: false, error: msg };
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

  const vendorLogin = useCallback(async (identifier, password) => {
    const res = await login(identifier, password);
    if (res.success) {
      // Ensure the user actually has a professional role
      if (res.role !== 'vendor' && res.role !== 'organiser' && res.role !== 'staff' && res.role !== 'admin') {
        // Not a professional role
        await logout();
        return { success: false, error: 'Access denied. This portal is for professional service providers only.' };
      }
    }
    return res;
  }, [login, logout]);

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
    global.bmtPromotionShownThisAppLaunch = false;
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    vendorLogin,
    verifyLoginOTP,
    logout,
    loading,
    selectedCity,
    locationHierarchy,
    updateCity,
    recentlyViewed,
    addToRecentlyViewed
  }), [user, login, vendorLogin, verifyLoginOTP, logout, loading, selectedCity, locationHierarchy, updateCity, recentlyViewed, addToRecentlyViewed]);


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

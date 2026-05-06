import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useSupabase';

interface LocationData {
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

interface LocationContextType {
  location: LocationData;
  setLocation: (data: LocationData) => Promise<void>;
  loading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [location, setLocationState] = useState<LocationData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocation();
  }, [user]);

  const loadLocation = async () => {
    setLoading(true);
    try {
      // 1. Try to load from SecureStore first (for instant UI)
      const stored = await SecureStore.getItemAsync('user_location');
      if (stored) {
        setLocationState(JSON.parse(stored));
      }

      // 2. If user is logged in, try to fetch from Supabase
      if (user) {
        const { data, error } = await supabase
          .from('user_locations')
          .select('*, countries(name), states(name), districts(name), cities(name)')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();

        if (data && !error) {
          const fetchedLocation: LocationData = {
            country: data.countries?.name,
            state: data.states?.name,
            district: data.districts?.name,
            city: data.cities?.name,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
          };
          setLocationState(fetchedLocation);
          await SecureStore.setItemAsync('user_location', JSON.stringify(fetchedLocation));
        }
      }
    } catch (error) {
      console.error('Error loading location:', error);
    } finally {
      setLoading(false);
    }
  };

  const setLocation = async (data: LocationData) => {
    setLocationState(data);
    await SecureStore.setItemAsync('user_location', JSON.stringify(data));

    // If user is logged in, sync to Supabase
    if (user) {
      try {
        // Find IDs for names
        const [countryRes, stateRes, districtRes, cityRes] = await Promise.all([
          data.country ? supabase.from('countries').select('id').eq('name', data.country).maybeSingle() : Promise.resolve({ data: null }),
          data.state ? supabase.from('states').select('id').eq('name', data.state).maybeSingle() : Promise.resolve({ data: null }),
          data.district ? supabase.from('districts').select('id').eq('name', data.district).maybeSingle() : Promise.resolve({ data: null }),
          data.city ? supabase.from('cities').select('id').eq('name', data.city).maybeSingle() : Promise.resolve({ data: null }),
        ]);

        const upsertData = {
          user_id: user.id,
          country_id: countryRes.data?.id,
          state_id: stateRes.data?.id,
          district_id: districtRes.data?.id,
          city_id: cityRes.data?.id,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          is_default: true,
          updated_at: new Error().toISOString(), // trigger update
        };

        const { error } = await supabase
          .from('user_locations')
          .upsert(upsertData, { onConflict: 'user_id, is_default' });

        if (error) console.error('Error syncing location to Supabase:', error);
      } catch (error) {
        console.error('Error in setLocation sync:', error);
      }
    }
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, loading }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

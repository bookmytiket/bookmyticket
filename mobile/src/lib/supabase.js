import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://yayrfycnmbpeeintfcvf.supabase.co';
const supabaseAnonKey = 'sb_publishable_uDGW5qXObQq5NseQGJVwTQ_ZgIur68-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

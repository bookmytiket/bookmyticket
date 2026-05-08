import { supabase } from '../supabase';

/**
 * Unified API Service for the Web Portal.
 * Mirrored with Mobile DataService for consistent architecture.
 */
export const ApiService = {
  /**
   * Events
   */
  async getEvents(filters = {}) {
    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getEventById(id) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Services & Professionals
   */
  async getServiceProviders() {
    const { data, error } = await supabase
      .from('service_providers')
      .select('*')
      .eq('status', 'active');
    if (error) throw error;
    return data;
  },

  /**
   * Wallet & Payments
   */
  async getWalletBalance(userId) {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();
    if (error) return { balance: 0 };
    return data;
  },

  /**
   * Realtime Subscription Helper
   */
  subscribe(table, callback) {
    return supabase
      .channel(`web-sync-${table}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => callback(payload)
      )
      .subscribe();
  }
};

/**
 * Shared Auth Service
 */
export const AuthService = {
  async signIn(email, otp) {
    return await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
  },
  async signOut() {
    return await supabase.auth.signOut();
  },
  async getProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  }
};

/**
 * Shared Booking Service
 */
export const BookingService = {
  async createBooking(bookingData) {
    const { data, error } = await supabase.from('bookings').insert(bookingData).select().single();
    if (error) throw error;
    return data;
  },
  async getMyBookings(userId) {
    const { data, error } = await supabase.from('bookings').select('*, events(*)').eq('user_id', userId);
    if (error) throw error;
    return data;
  }
};

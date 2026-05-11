import { supabase } from '../lib/supabase';

/**
 * Unified Data Service to ensure consistent data fetching and structures
 * between web and mobile.
 */
export const DataService = {
  /**
   * Fetches all active events with consistent filtering and ordering.
   */
  async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Consistent filtering: status != 'draft', 'inactive', 'expired'
    return (data || []).filter(ev => {
      const status = String(ev.status || '').toLowerCase();
      return !['draft', 'inactive', 'expired'].includes(status);
    });
  },

  /**
   * Fetches a single event by ID with all related data.
   */
  async getEventDetail(id: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Fetches active service providers (professionals).
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
   * Fetches unified services.
   */
  async getServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'Published');
    
    if (error) throw error;
    return data;
  },

  /**
   * Fetches venue layouts for an event.
   */
  async getVenueLayouts(eventId: string) {
    const { data, error } = await supabase
      .from('venue_layouts')
      .select('*, seat_blocks(*)')
      .eq('event_id', eventId);
    
    if (error) throw error;
    return data;
  },

  /**
   * Fetches seats for a specific block.
   */
  async getSeats(blockId: string) {
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('block_id', blockId)
      .order('row_name', { ascending: true })
      .order('seat_number', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  /**
   * Fetches branding assets (coupons, banners).
   */
  async getBrandingAssets() {
    const [banners, coupons] = await Promise.all([
      supabase.from('branding_banners').select('*').eq('status', 'Active'),
      supabase.from('branding_coupons').select('*').eq('status', 'Active')
    ]);
    
    return {
      banners: banners.data || [],
      coupons: coupons.data || []
    };
  },

  /**
   * Subscribes to real-time updates for a specific table.
   * Ensures consistent channel naming and cleanup.
   */
  subscribeToTable(table: string, onUpdate: (payload: any) => void) {
    const channelId = `sync-${table}-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => onUpdate(payload)
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }
};

/**
 * Shared Auth Service
 */
export const AuthService = {
  async signIn(email: string, otp: string) {
    return await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
  },
  async signOut() {
    return await supabase.auth.signOut();
  },
  async getProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  }
};

/**
 * Shared Booking Service
 */
export const BookingService = {
  async createBooking(bookingData: any) {
    const { data, error } = await supabase.from('bookings').insert(bookingData).select().single();
    if (error) throw error;
    return data;
  },
  async getMyBookings(userId: string) {
    const { data, error } = await supabase.from('bookings').select('*, events(*)').eq('user_id', userId);
    if (error) throw error;
    return data;
  }
};

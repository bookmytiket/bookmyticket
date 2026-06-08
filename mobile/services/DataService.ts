import { supabase } from '../lib/supabase';
import UnifiedApi from '../lib/unifiedApi';

/**
 * Unified Data Service to ensure consistent data fetching and structures
 * between web and mobile.
 */
const DataService = {
  /**
   * Fetches all active events from the unified Public API
   * to ensure strict data mapping and prevent organizer leakage.
   */
  async getPublicEvents(city?: string, district?: string) {
    try {
      const events = await UnifiedApi.getEvents({ district, city, t: Date.now() });
      if (Array.isArray(events) && events.length > 0) return events;

      // If the canonical API has stricter publish/location filters than older
      // mobile data, keep the home feed populated from the same Supabase source.
      return this.getEvents();
    } catch (err) {
      console.warn('DataService.getPublicEvents failed, falling back to direct Supabase:', err);
      // Fallback to legacy direct fetch if API is unreachable
      return this.getEvents();
    }
  },

  /**
   * Fetches all active events with consistent filtering and ordering (Legacy).
   */
  async getEvents() {

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .neq('is_deleted', true)
      .not('status', 'in', '("CANCELLED","DELETED","CANCELLATION_REQUESTED","DELETION_REQUESTED")')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Consistent filtering: status != 'draft', 'inactive', 'expired'
    return (Array.isArray(data) ? data : []).filter(ev => {
      const status = String(ev.status || '').toLowerCase();
      const publishStatus = String(ev.publish_status || '').toLowerCase();
      return !['draft', 'inactive', 'expired'].includes(status) || publishStatus === 'published';
    });
  },

  /**
   * Fetches events for a specific organiser with full ownership resolution.
   */
  async getOrganiserEvents(userId: string) {
    // 1. Resolve true organiser ID
    let { data: organiser } = await supabase
      .from('organisers')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!organiser) {
      const { data: altOrg } = await supabase
        .from('organisers')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle();
      if (altOrg) organiser = altOrg;
    }

    const targetId = organiser?.id || userId;

    // 2. Fetch scoped events
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organiser_id', targetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Fetches a single event by ID with all related data.
   */
  async getEventDetail(id: string) {
    try {
      return await UnifiedApi.getEvent(id);
    } catch (err) {
      console.warn('DataService.getEventDetail failed, falling back to direct Supabase:', err);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
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
      supabase.from('brand_banners').select('*').eq('status', 'Active'),
      supabase.from('brand_coupons').select('*').eq('status', 'Active')
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
const AuthService = {
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
const BookingService = {
  async createBooking(bookingData: any) {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://bookmyticket.com';
    const response = await fetch(`${baseUrl}/api/mobile/create-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Booking creation failed');
    return payload;
  },
  async getMyBookings(userId: string) {
    return await UnifiedApi.getBookings();
  }
};

export { DataService, AuthService, BookingService };
export default DataService;

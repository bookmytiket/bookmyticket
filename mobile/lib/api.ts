import { supabase } from './supabase';

/**
 * Shared API Layer for BookMyTicket
 * Used by both Web (Next.js) and Mobile (Expo)
 */

export interface Event {
  id: string;
  title: string;
  description?: string;
  img?: string;
  date: string;
  time?: string;
  location: string;
  city?: string;
  category?: string;
  price?: number;
  featured?: boolean;
  trending?: boolean;
  dynamic_config?: any;
  tickets?: any;
  [key: string]: any;
}

// --- Events ---

export const getEvents = async (filters: { city?: string; category?: string } = {}) => {
  let query = supabase.from('events').select('*')
    .neq('is_deleted', true)
    .not('status', 'in', '("CANCELLED","DELETED","CANCELLATION_REQUESTED","DELETION_REQUESTED")');
  
  if (filters.city && filters.city !== 'All Cities') {
    query = query.ilike('city', `%${filters.city}%`);
  }
  
  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as Event[];
};

export const getEventById = async (id: string) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .neq('is_deleted', true)
    .not('status', 'in', '("DELETED")')
    .single();
  if (error) throw error;
  return data as Event;
};

// --- Bookings (Role-Based Access) ---

export const getBookings = async (user: any) => {
  if (!user) return [];
  
  let query = supabase.from('bookings').select('*, events(*)');

  // RBAC: Normal users see only their own bookings
  if (user.role === 'user' || !user.role) {
    query = query.eq('user_id', user.id);
  } 
  // RBAC: Organisers see bookings for their events
  else if (user.role === 'organiser') {
    query = query.eq('organiser_id', user.id);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// --- Profiles ---

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};

// --- Organiser Specific ---

export const getMyEvents = async (organiserId: string) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organiser_id', organiserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Event[];
};

// --- Partner Specific ---

export const getPartnerRequests = async (partnerId: string) => {
  const { data, error } = await supabase
    .from('branding_requests')
    .select('*, branding_partners(*)')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// --- Service Provider Specific ---

export const getProviderRequests = async (providerId: string) => {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*, services(*)')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// --- Wallet & Payouts ---

export const getWallet = async (organiserId: string) => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('organiser_id', organiserId)
    .single();
  if (error) throw error;
  return data;
};

export const getWalletTransactions = async (organiserId: string) => {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('organiser_id', organiserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getWithdrawRequests = async (organiserId: string) => {
  const { data, error } = await supabase
    .from('withdraw_requests')
    .select('*')
    .eq('organiser_id', organiserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createWithdrawRequest = async (request: any) => {
  const { data, error } = await supabase
    .from('withdraw_requests')
    .insert([request])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// --- System Config ---

export const getSystemConfig = async () => {
  const { data, error } = await supabase
    .from('system_config')
    .select('*');
  if (error) throw error;
  return data;
};

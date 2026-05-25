import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

type Query = Record<string, string | number | boolean | null | undefined>;

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as any)?.apiUrl ||
  (__DEV__ ? 'http://172.20.10.2:3000' : 'https://www.bookmyticket.net');

const OFFLINE_QUEUE_KEY = 'bmt_offline_sync_queue';

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function request<T>(path: string, options: RequestInit = {}, query?: Query): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-BMT-Client': 'expo',
    ...(await authHeaders()),
    ...((options.headers || {}) as Record<string, string>),
  };

  const response = await fetch(buildUrl(path, query), { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.ok === false) {
    const message = payload?.error?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload?.data ?? payload;
}

async function enqueue(path: string, body: any) {
  const raw = await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  queue.push({ id: `${Date.now()}-${Math.random()}`, path, body, createdAt: new Date().toISOString() });
  await SecureStore.setItemAsync(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-50)));
}

export const UnifiedApi = {
  baseUrl: API_BASE_URL,

  async getEvents(query: Query = {}) {
    const events = await request<any[]>('/api/v1/events', {}, query);
    return Array.isArray(events) ? events : [];
  },

  getEvent(id: string) {
    return request<any>(`/api/v1/events/${id}`);
  },

  getBookings() {
    return request<any[]>('/api/v1/bookings');
  },

  createBooking(booking: any) {
    return request<any>('/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify({ booking }),
    });
  },

  getPayments() {
    return request<any[]>('/api/v1/payments');
  },

  async getCoupons(query: Query = {}) {
    const coupons = await request<any[]>('/api/v1/coupons', {}, query);
    return Array.isArray(coupons) ? coupons : [];
  },

  validateCoupon(body: any) {
    return request<any>('/api/v1/coupons', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getTicket(id: string) {
    return request<any>(`/api/v1/tickets/${id}`);
  },

  getWallet() {
    return request<{ wallet: any; transactions: any[]; withdrawRequests: any[] }>('/api/v1/wallet');
  },

  getNotifications() {
    return request<any[]>('/api/v1/notifications');
  },

  getFeatureFlags(platform = 'expo') {
    return request<Record<string, boolean>>('/api/v1/feature-flags', {}, { platform });
  },

  async getSeatInventory(eventId: string, showtimeId?: string) {
    let query = supabase.from('seat_inventory').select('*').eq('event_id', eventId);
    if (showtimeId) {
      query = query.eq('showtime_id', showtimeId);
    } else {
      query = query.is('showtime_id', null);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getGeneralInventory(eventId: string, showtimeId?: string) {
    let query = supabase.from('general_inventory').select('*').eq('event_id', eventId);
    if (showtimeId) {
      query = query.eq('showtime_id', showtimeId);
    } else {
      query = query.is('showtime_id', null);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  validateTicketScan(body: any) {
    return request<any>('/api/v1/staff/validate-ticket', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  submitTicketScanAction(body: any) {
    return request<any>('/api/v1/staff/ticket-action', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async registerDevice(body: any) {
    try {
      return await request('/api/v1/devices/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error) {
      await enqueue('/api/v1/devices/register', body);
      throw error;
    }
  },

  async logSyncFailure(body: any) {
    try {
      return await request('/api/v1/sync/log', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch {
      await enqueue('/api/v1/sync/log', body);
      return null;
    }
  },

  async flushOfflineQueue() {
    const raw = await SecureStore.getItemAsync(OFFLINE_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    if (!queue.length) return { flushed: 0, remaining: 0 };

    const remaining = [];
    let flushed = 0;
    for (const item of queue) {
      try {
        await request(item.path, { method: 'POST', body: JSON.stringify(item.body) });
        flushed += 1;
      } catch {
        remaining.push(item);
      }
    }
    await SecureStore.setItemAsync(OFFLINE_QUEUE_KEY, JSON.stringify(remaining.slice(-50)));
    return { flushed, remaining: remaining.length };
  },
};

export default UnifiedApi;

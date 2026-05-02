import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useSupabaseQuery(
  table: string,
  queryFn = (q: any) => q,
  deps: any[] = [],
  options: any = {}
) {
  const { realtime = false, initialData = undefined, enabled = true } = options;

  const [data, setData] = useState<any[] | undefined>(initialData);
  const [loading, setLoading] = useState(enabled && !initialData);
  const [error, setError] = useState<any>(null);

  const isMounted = useRef(true);
  const lastFetchRef = useRef(0);
  const subscriptionRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    if (!table || !isMounted.current || !enabled) return;

    // Debounce: ignore calls within 500ms
    const now = Date.now();
    if (now - lastFetchRef.current < 500) return;
    lastFetchRef.current = now;

    try {
      setLoading(true);
      let query = supabase.from(table).select('*');
      query = queryFn(query);

      const { data: result, error: err } = await query;
      if (err) throw err;

      if (isMounted.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      console.error(`useSupabaseQuery error (${table}):`, err);
      if (isMounted.current) setError(err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [table, enabled, ...deps]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    // Fix: subscribe BEFORE calling .subscribe(), and only when realtime=true
    if (realtime && table) {
      console.log(`[Supabase] Subscribing to real-time for: ${table}`);
      const channel = supabase
        .channel(`public:${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            console.log(`[Supabase] Real-time update for ${table}:`, payload.eventType);
            fetchData();
          }
        )
        .subscribe((status) => {
          console.log(`[Supabase] Subscription status for ${table}:`, status);
        });
        
      subscriptionRef.current = channel;
    }

    return () => {
      isMounted.current = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [table, JSON.stringify(deps), realtime, enabled]);

  return { data, loading, error, refresh: fetchData };
}

export function useSupabaseMutation(
  table: string,
  type: 'insert' | 'update' | 'delete' | 'upsert' = 'insert'
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const mutate = async (payload: any, queryFn = (q: any) => q) => {
    setLoading(true);
    setError(null);

    try {
      let query: any;
      switch (type) {
        case 'insert':
          query = supabase.from(table).insert(payload).select();
          break;
        case 'update':
          query = supabase.from(table).update(payload).select();
          break;
        case 'delete':
          query = supabase.from(table).delete().select();
          break;
        case 'upsert':
          query = supabase.from(table).upsert(payload).select();
          break;
        default:
          throw new Error(`Unsupported mutation type: ${type}`);
      }

      query = queryFn(query);
      const { data, error: err } = await query;
      if (err) throw err;
      return { success: true, data };
    } catch (err) {
      console.error(`Mutation error on ${table}:`, err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return [mutate, { loading, error }] as const;
}

// Auth helpers
export function useAuth() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, user, loading, signOut };
}

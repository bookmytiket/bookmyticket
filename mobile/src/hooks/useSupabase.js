import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseQuery(table, queryFn = (q) => q, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    isMounted.current = true;

    async function fetchData(isRetry = false) {
      if (!isMounted.current) return;

      // Safety check: if any dependency is undefined or an empty string, 
      // we likely don't have the user ID or required filter yet.
      // Skipping prevents "invalid input syntax for type uuid: 'undefined'" (22P02)
      if (deps && deps.some(d => d === undefined || d === 'undefined' || d === '')) {
        setLoading(false);
        return;
      }

      const handleContentionError = async (err) => {
        const errMsg = err.message || JSON.stringify(err);
        const isLockError = 
          err.name === 'AbortError' || 
          errMsg.includes('Lock') || 
          errMsg.includes('contention') || 
          errMsg.includes('stole') ||
          errMsg.includes('released');

        if (isLockError && retryCountRef.current < MAX_RETRIES) {
          const delay = Math.pow(2, retryCountRef.current) * 1000 + (Math.random() * 500);
          console.warn(`Supabase contention for ${table}, retrying in ${Math.round(delay)}ms...`);
          retryCountRef.current++;
          setTimeout(() => fetchData(true), delay);
          return true;
        }
        return false;
      };

      try {
        if (!isRetry) setLoading(true);
        let base = supabase.from(table);
        let query;

        try {
            // First attempt: Assume queryFn handles its own select (New Style)
            // or is the default (q) => q.
            query = queryFn(base);
            
            // If the resulting object still has a 'select' method, 
            // it means no select operation was initiated yet.
            if (query && typeof query.select === 'function') {
                query = query.select('*');
            }
        } catch (err) {
            // Fallback: Assume queryFn expects an already-selected query builder (Old Style)
            // This happens if queryFn tries to call .eq() directly on the passed object.
            try {
                query = queryFn(base.select('*'));
            } catch (fallbackErr) {
                // If even this fails, throw the original error
                throw err;
            }
        }

        const { data: result, error: queryError } = await query;
        
        if (queryError) {
          if (await handleContentionError(queryError)) return;
          throw queryError;
        }
        
        if (isMounted.current) {
          setData(result);
          setError(null);
          retryCountRef.current = 0;
        }
      } catch (err) {
        if (await handleContentionError(err)) return;
        console.error(`Error fetching ${table}:`, err);
        if (isMounted.current) setError(err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    }

    // Stagger initial fetch
    const jitter = Math.random() * 200;
    const timeoutId = setTimeout(() => fetchData(), jitter);

    // Subscribe to changes for reactivity
    const channelId = `realtime:${table}:${Math.floor(Math.random() * 1000000)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      isMounted.current = false;
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [table, JSON.stringify(deps)]);

  return { data, loading, error };
}

export function useSupabaseMutation(mutationFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutationFn(supabase, ...args);
      return result;
    } catch (err) {
      console.error('Mutation error:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}

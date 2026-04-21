import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * A custom hook to fetch data from Supabase with Realtime support and performance optimizations.
 * @param {string} table The table name.
 * @param {function} queryFn A function that takes a supabase query builder and returns it.
 * @param {Array} deps Dependencies for re-fetching.
 * @param {object} options Configuration options: { realtime, retryCount, initialData }
 */
export function useSupabaseQuery(table, queryFn = (q) => q, deps = [], options = {}) {
  const { realtime = true, initialData = undefined } = options;
  
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  
  const isMounted = React.useRef(true);
  const retryCountRef = React.useRef(0);
  const lastFetchRef = React.useRef(0);
  const fetchTimeoutRef = React.useRef(null);
  const MAX_RETRIES = 5;

  const fetchData = async (isRetry = false) => {
    if (!table || !isMounted.current) return;
    
    if (!supabase) {
      if (!isRetry) {
        console.error("Supabase client is not initialized. Please check your environment variables.");
        setError(new Error("Supabase internal error: Client not initialized"));
        setLoading(false);
      }
      return;
    }

    // Simple debounce to prevent frequent re-fetches (e.g. from rapid Realtime updates)
    const now = Date.now();
    if (!isRetry && now - lastFetchRef.current < 500) {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = setTimeout(() => fetchData(), 500);
      return;
    }
    lastFetchRef.current = now;

    const handleContentionError = async (err) => {
      const errMsg = err.message || JSON.stringify(err);
      const isLockError = 
        err.name === 'AbortError' || 
        errMsg.includes('Lock') || 
        errMsg.includes('contention') || 
        errMsg.includes('stole') ||
        errMsg.includes('released');

      if (isLockError && retryCountRef.current < MAX_RETRIES) {
        // Exponential backoff with jitter
        const delay = Math.pow(2, retryCountRef.current) * 1000 + (Math.random() * 500);
        console.warn(`Supabase contention for ${table}, retrying in ${Math.round(delay)}ms... (Attempt ${retryCountRef.current + 1})`);
        retryCountRef.current++;
        setTimeout(() => fetchData(true), delay);
        return true;
      }
      return false;
    };

    try {
      // We call .select() immediately to get the filter builder so queryFn can use eq(), order(), etc.
      let query = supabase.from(table).select("*");
      query = queryFn(query);
      
      const { data: result, error: err } = await query;
      
      if (err) {
        if (await handleContentionError(err)) return;
        throw err;
      }
      
      setData(result);
      setError(null);
      retryCountRef.current = 0; // Reset on success
    } catch (err) {
      if (await handleContentionError(err)) return;
      console.error(`Error in useSupabaseQuery (${table}):`, err);
      setError(err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    // Stagger initial fetch to prevent thundering herd on page load
    const jitter = Math.random() * 200;
    const initialFetchTimeout = setTimeout(() => {
      fetchData();
    }, jitter);

    let subscription = null;
    if (realtime && table && supabase) {
      const channelId = Math.random().toString(36).substring(2, 11);
      subscription = supabase
        .channel(`${table}_changes_${channelId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: table },
          () => {
            fetchData();
          }
        )
        .subscribe();
    }

    return () => {
      isMounted.current = false;
      clearTimeout(initialFetchTimeout);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (subscription && supabase) {
        supabase.removeChannel(subscription);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, JSON.stringify(deps), realtime]);

  return { data, loading, error, refresh: () => fetchData() };
}

/**
 * A custom hook for Supabase mutations (Insert, Update, Delete).
 * @param {string} table The table name.
 * @param {string} type The mutation type: 'insert', 'update', 'delete', or 'upsert'.
 * @param {function} queryFn Optional function to further customize the query (e.g., adding filters for update/delete).
 */
export function useSupabaseMutation(table, type = 'insert', queryFn = (q) => q) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (payload, options = {}) => {
    setLoading(true);
    setError(null);

    if (!supabase) {
      const err = new Error("Supabase client not initialized");
      setError(err);
      setLoading(false);
      return { success: false, error: err };
    }

    try {
      let query;
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
          query = supabase.from(table).upsert(payload, options).select();
          break;
        default:
          throw new Error(`Unsupported mutation type: ${type}`);
      }

      query = queryFn(query, payload);
      
      const { data, error: err } = await query;
      if (err) throw err;
      return { success: true, data };
    } catch (err) {
      console.error(`Mutation error on ${table}:`, err);
      setError(err);
      throw err; // Re-throw to allow component-level try/catch
    } finally {
      setLoading(false);
    }
  };

  return [mutate, { loading, error }];
}

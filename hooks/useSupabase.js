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
  const { realtime = true, initialData = undefined, enabled = true } = options;
  
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled && !initialData);
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
      const errMsg = err?.message || JSON.stringify(err);
      const isLockError = 
        err?.name === 'AbortError' || 
        errMsg.includes('Lock') || 
        errMsg.includes('contention') || 
        errMsg.includes('stole') ||
        errMsg.includes('released');

      if (isLockError) {
        if (retryCountRef.current < MAX_RETRIES) {
          // Exponential backoff with jitter
          const delay = Math.pow(2, retryCountRef.current) * 1000 + (Math.random() * 500);
          console.warn(`Supabase contention for ${table}, retrying in ${Math.round(delay)}ms... (Attempt ${retryCountRef.current + 1})`);
          retryCountRef.current++;
          
          // Clear any current error to keep UI in loading state instead of error state
          setError(null);
          setLoading(true);
          
          setTimeout(() => fetchData(true), delay);
          return true;
        } else {
          console.error(`Max retries reached for ${table} contention error.`);
        }
      }
      return false;
    };

    try {
      // We call .select() immediately to get the filter builder so queryFn can use eq(), order(), etc.
      let query = supabase.from(table).select(options.select || "*");
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
    
    if (!enabled) {
        setLoading(false);
        return;
    }
    
    // Set loading to true whenever dependencies change to trigger fresh fetch
    setLoading(true);
    fetchData();

    const subscriptions = [];
    
    if (realtime && supabase) {
      const tablesToListen = [table, ...(options.refreshOn || [])].filter(Boolean);
      
      tablesToListen.forEach(tableName => {
        const channelId = Math.random().toString(36).substring(2, 11);
        const sub = supabase
          .channel(`${tableName}_changes_${channelId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName },
            () => {
              fetchData();
            }
          )
          .subscribe();
        subscriptions.push(sub);
      });
    }

    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      subscriptions.forEach(sub => {
        if (sub && supabase) supabase.removeChannel(sub);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, JSON.stringify(deps), realtime, JSON.stringify(options.refreshOn)]);

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

/**
 * A custom hook to manage system configuration (key-value) in Supabase.
 * @param {string} table The table name (usually system_config).
 * @param {object} initialValue The initial value object { key, ...rest }.
 */
export function useSupabaseConfig(table, initialValue) {
    const { key } = initialValue || {};
    const { data, refresh } = useSupabaseQuery(table, (q) => key ? q.eq('key', key) : q, [key], { realtime: false });
    const [updateConfig] = useSupabaseMutation(table, 'update', (q, p) => p.id ? q.eq('id', p.id) : (key ? q.eq('key', key) : q));

    const config = React.useMemo(() => {
        const rawData = data && data[0] ? data[0] : initialValue;
        return (table === 'system_config' && rawData?.value) 
            ? { ...rawData, ...rawData.value } 
            : rawData;
    }, [data, table, JSON.stringify(initialValue)]);

    const setConfig = async (newValue) => {
        const payload = typeof newValue === 'function' ? newValue(config) : newValue;
        const isKeyValueTable = table === 'system_config';
        
        if (config.id || (isKeyValueTable && key)) {
            let updatePayload;
            if (isKeyValueTable) {
                const { id: _, key: __, value: ___, updated_at: ____, ...rest } = payload;
                updatePayload = { key, value: rest };
                if (config.id) updatePayload.id = config.id;
            } else {
                updatePayload = { ...payload };
                if (config.id) updatePayload.id = config.id;
            }
            
            Object.keys(updatePayload).forEach(k => updatePayload[k] === undefined && delete updatePayload[k]);
            await updateConfig(updatePayload);
            refresh();
        } else {
            await supabase.from(table).insert(isKeyValueTable ? { key, value: payload } : payload);
            refresh();
        }
    };

    return [config, setConfig];
}

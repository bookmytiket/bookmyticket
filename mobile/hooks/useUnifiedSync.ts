import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import UnifiedApi from '@/lib/unifiedApi';

type Loader<T> = () => Promise<T>;

export function useUnifiedResource<T>(
  resource: string,
  loader: Loader<T>,
  deps: any[] = [],
  options: { enabled?: boolean; realtimeTables?: string[]; initialData?: T } = {}
) {
  const { enabled = true, realtimeTables = [], initialData } = options;
  const depsKey = JSON.stringify(deps);
  const realtimeTablesKey = realtimeTables.join('|');
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(enabled && !initialData);
  const [error, setError] = useState<any>(null);
  const mounted = useRef(true);
  const loaderRef = useRef(loader);

  // Keep loaderRef up to date
  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const refresh = useCallback(async () => {
    void depsKey;
    if (!enabled) return;
    try {
      setLoading(true);
      const result = await loaderRef.current();
      if (mounted.current) {
        setData(result);
        setError(null);
      }
    } catch (err: any) {
      if (mounted.current) setError(err);
      UnifiedApi.logSyncFailure({
        resource,
        action: 'read',
        error_message: err?.message || 'Unified read failed',
      });
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [enabled, resource, depsKey]);

  useEffect(() => {
    mounted.current = true;
    queueMicrotask(() => refresh());

    const tables = realtimeTablesKey ? realtimeTablesKey.split('|') : [];
    const channels = tables.map((table) =>
      supabase
        .channel(`unified-${resource}-${table}-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => refresh())
        .subscribe()
    );

    return () => {
      mounted.current = false;
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [refresh, realtimeTablesKey, resource]);

  return { data, loading, error, refresh };
}

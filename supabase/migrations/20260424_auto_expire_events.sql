-- Automatic Event Expiration System
-- This migration adds a function and a trigger/job to ensure events are marked as expired once their date passes.

-- 1. Create a robust function to update event statuses based on current timestamp
CREATE OR REPLACE FUNCTION public.auto_expire_events()
RETURNS void AS $$
DECLARE
    now_ts TIMESTAMPTZ := NOW();
BEGIN
    -- Update status to 'expired' for events that have passed
    -- We parse 'date' (usually YYYY-MM-DD) and 'time' (usually HH:MM)
    UPDATE public.events
    SET status = 'expired'
    WHERE status = 'published' -- Only expire active/published events
      AND (
        CASE 
          WHEN date::text ~ '^\d{4}-\d{2}-\d{2}$' AND (time IS NULL OR time::text = '') THEN 
            (date::text || ' 23:59:59')::timestamp < now_ts
          WHEN date::text ~ '^\d{4}-\d{2}-\d{2}$' AND time::text ~ '^\d{1,2}:\d{2}' THEN 
            (date::text || ' ' || time::text)::timestamp < now_ts
          -- Handle other formats if necessary
          ELSE FALSE
        END
      );
END;
$$ LANGUAGE plpgsql;

-- 2. Create a secure wrapper for RPC calls from the frontend (if needed)
CREATE OR REPLACE FUNCTION public.run_auto_expire()
RETURNS json AS $$
BEGIN
  PERFORM public.auto_expire_events();
  RETURN json_build_object('success', true, 'timestamp', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Note: pg_cron is often restricted in Supabase shared environments.
-- If pg_cron is available, you can uncomment the following:
-- SELECT cron.schedule('expire-events-hourly', '0 * * * *', 'SELECT public.auto_expire_events()');

-- 4. Initial run to clean up existing data
SELECT public.auto_expire_events();

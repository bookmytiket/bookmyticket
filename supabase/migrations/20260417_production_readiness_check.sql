-- Production Readiness & Connectivity Diagnostic
-- Run this in the Supabase SQL Editor to verify your live environment state.

-- 1. Check if the 'organisers' table correctly exists and has entries
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organisers') THEN
        RAISE NOTICE 'Table "organisers" EXISTS.';
    ELSE
        RAISE NOTICE 'CRITICAL: Table "organisers" is MISSING.';
    END IF;
END $$;

-- 2. Validate RLS policies for events (Ensuring public visibility)
SELECT 
    schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'events';

-- 3. Check current event count and distribution
SELECT 
    status, 
    count(*), 
    SUM(CASE WHEN featured THEN 1 ELSE 0 END) as featured_count
FROM public.events 
GROUP BY status;

-- 4. Check if current admin user exists in organisers table (Replace ID with your auth.uid() if testing)
-- SELECT id, business_name FROM public.organisers WHERE id = 'YOUR_USER_ID_HERE';

-- 5. System Config check
SELECT key, value FROM public.system_config;

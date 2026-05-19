-- Enable Realtime for all essential tables to ensure instant synchronization between Web and Mobile
-- This adds the specified tables to the 'supabase_realtime' publication

-- First, ensure the publication exists (usually it does by default)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Drop and re-add tables to ensures they are in the publication
-- This is safer than just 'ALTER' in case they were already there with different settings
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS 
    public.events, 
    public.services, 
    public.bookings, 
    public.tickets, 
    public.payments, 
    public.wallets, 
    public.profiles, 
    public.notifications,
    public.branding_banners,
    public.branding_coupons,
    public.memories,
    public.marathon_categories,
    public.service_providers;

ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.events, 
    public.services, 
    public.bookings, 
    public.tickets, 
    public.payments, 
    public.wallets, 
    public.profiles, 
    public.notifications,
    public.branding_banners,
    public.branding_coupons,
    public.memories,
    public.marathon_categories,
    public.service_providers;

-- Set REPLICA IDENTITY to FULL for essential tables to ensure all column changes are sent in the realtime payload
-- This is important for components that rely on specific column updates
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.services REPLICA IDENTITY FULL;
ALTER TABLE public.branding_banners REPLICA IDENTITY FULL;
ALTER TABLE public.branding_coupons REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.wallets REPLICA IDENTITY FULL;
ALTER TABLE public.marathon_categories REPLICA IDENTITY FULL;

-- Ensure RLS is enabled but policies allow authenticated users to see updates
-- Assuming RLS is already set up, but let's make sure 'postgres' role (used by Supabase) has full access
-- which it does by default.

COMMENT ON PUBLICATION supabase_realtime IS 'Unified Realtime Publication for Web and Mobile Sync';

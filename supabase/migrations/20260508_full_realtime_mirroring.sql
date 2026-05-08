-- UNIFIED ARCHITECTURE REALTIME SYNC MIGRATION
-- This migration ensures all core operational tables are synchronized in real-time.

-- 1. Ensure the publication exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Add ALL core tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE 
    events, 
    services,
    marathon_categories,
    branding_banners, 
    branding_coupons, 
    memories,
    profiles,
    bookings,
    tickets,
    wallets,
    wallet_transactions,
    notifications,
    payments,
    service_providers;

-- 3. Set REPLICA IDENTITY to FULL for all tables to ensure complete data payloads
-- This is critical for mobile apps to get the "before" and "after" state if needed, 
-- and to ensure all columns are included in the broadcast.
ALTER TABLE events REPLICA IDENTITY FULL;
ALTER TABLE services REPLICA IDENTITY FULL;
ALTER TABLE marathon_categories REPLICA IDENTITY FULL;
ALTER TABLE branding_banners REPLICA IDENTITY FULL;
ALTER TABLE branding_coupons REPLICA IDENTITY FULL;
ALTER TABLE memories REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE bookings REPLICA IDENTITY FULL;
ALTER TABLE tickets REPLICA IDENTITY FULL;
ALTER TABLE wallets REPLICA IDENTITY FULL;
ALTER TABLE wallet_transactions REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE payments REPLICA IDENTITY FULL;
ALTER TABLE service_providers REPLICA IDENTITY FULL;

-- 4. Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

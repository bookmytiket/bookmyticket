-- Advanced Seating Layout System Migration
-- Created: 2026-05-10
-- Revised: 2026-05-11 (Fixed legacy conflicts & Deadlocks)

-- 0. Set Lock Timeout (Prevents hanging if dev server is active)
SET lock_timeout = '5000'; -- 5 seconds

-- 0.1 Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0.1 Cleanup Legacy Seating System (to prevent column mismatch errors)
DROP TABLE IF EXISTS booked_seats CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS seat_maps CASCADE;

-- 1. Venue Layouts (Top level image/blueprint)
CREATE TABLE IF NOT EXISTS venue_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    layout_name TEXT NOT NULL,
    image_url TEXT,
    layout_type TEXT DEFAULT 'stadium', -- stadium, theatre, arena
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Seat Blocks (Sections of the stadium)
CREATE TABLE IF NOT EXISTS seat_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_layout_id UUID REFERENCES venue_layouts(id) ON DELETE CASCADE,
    block_name TEXT NOT NULL,
    block_type TEXT DEFAULT 'general', -- vip, premium, general
    color_code TEXT DEFAULT '#ec4899',
    base_price NUMERIC DEFAULT 0,
    -- Spatial coordinates for the block on the main image
    x_pos NUMERIC,
    y_pos NUMERIC,
    width NUMERIC,
    height NUMERIC,
    -- Meta for rows/cols
    rows_count INTEGER DEFAULT 1,
    cols_count INTEGER DEFAULT 1,
    row_naming_type TEXT DEFAULT 'alphabetic', -- alphabetic, numeric
    numbering_start INTEGER DEFAULT 1,
    numbering_direction TEXT DEFAULT 'ltr' -- ltr, rtl
);

-- 3. Individual Seats
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id UUID REFERENCES seat_blocks(id) ON DELETE CASCADE,
    row_name TEXT,
    seat_number TEXT,
    x_position NUMERIC, -- Position relative to block
    y_position NUMERIC,
    rotation NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'available', -- available, booked, blocked, reserved
    price_override NUMERIC, -- Optional price per seat
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Seat Bookings (Permanent/Finalized)
CREATE TABLE IF NOT EXISTS seat_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    order_id UUID, -- Link to orders table if exists
    booking_status TEXT DEFAULT 'confirmed', -- confirmed, pending, cancelled
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Seat Lock Logs (Temporary locks for 10-15 mins)
CREATE TABLE IF NOT EXISTS seat_lock_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
    locked_by UUID REFERENCES public.profiles(id),
    lock_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seats_block_id ON seats(block_id);
CREATE INDEX IF NOT EXISTS idx_seat_blocks_layout_id ON seat_blocks(venue_layout_id);
CREATE INDEX IF NOT EXISTS idx_venue_layouts_event_id ON venue_layouts(event_id);
CREATE INDEX IF NOT EXISTS idx_seat_lock_expiry ON seat_lock_logs(expires_at);

-- 7. Realtime Enablement
-- Note: Check if publication exists first or just alter
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE seats;
    ALTER PUBLICATION supabase_realtime ADD TABLE seat_lock_logs;
EXCEPTION WHEN OTHERS THEN
    -- Table might already be in publication
    NULL;
END $$;

-- 8. Row Level Security
ALTER TABLE venue_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_lock_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Organiser can manage, Users can view)
CREATE POLICY "Public layouts view" ON venue_layouts FOR SELECT USING (true);
CREATE POLICY "Public blocks view" ON seat_blocks FOR SELECT USING (true);
CREATE POLICY "Public seats view" ON seats FOR SELECT USING (true);
CREATE POLICY "Users can see locks" ON seat_lock_logs FOR SELECT USING (true);

-- Functions for auto-unlocking (Optional, but good for cleanup)
CREATE OR REPLACE FUNCTION release_expired_locks() RETURNS void AS $$
BEGIN
    DELETE FROM seat_lock_logs WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

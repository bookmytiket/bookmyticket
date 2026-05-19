-- Migration to support Advanced Marathon Pricing and Registration
-- Created at: 2026-05-07

-- 1. Create marathon_categories table for hierarchical pricing
CREATE TABLE IF NOT EXISTS marathon_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- e.g. "5KM Fun Run - Adults"
    distance_km DECIMAL, -- e.g. 5.0
    min_age INTEGER DEFAULT 0,
    max_age INTEGER DEFAULT 100,
    price DECIMAL NOT NULL DEFAULT 0,
    slots INTEGER DEFAULT 100,
    total_slots INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create marathon_registrations table to track specific category bookings
CREATE TABLE IF NOT EXISTS marathon_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES marathon_categories(id) ON DELETE SET NULL,
    participant_name TEXT,
    participant_age INTEGER,
    participant_gender TEXT,
    tshirt_size TEXT,
    selected_km DECIMAL,
    ticket_price DECIMAL,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_marathon_categories_event ON marathon_categories(event_id);
CREATE INDEX IF NOT EXISTS idx_marathon_registrations_event ON marathon_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_marathon_registrations_user ON marathon_registrations(user_id);

-- 4. Enable Realtime for live inventory updates
ALTER PUBLICATION supabase_realtime ADD TABLE marathon_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE marathon_registrations;

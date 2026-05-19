-- Advanced Event Creation & Seat Booking Infrastructure
-- Phase 1: Database Schema Expansion

-- 1. Events Table Enhancements
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'Physical Event';
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS age_restriction TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS terms_conditions TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS parking_details TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS entry_gate TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS seating_capacity INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS emergency_exit TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_trailer_url TEXT;

-- 2. Ticket Categories Table
CREATE TABLE IF NOT EXISTS ticket_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    ticket_price NUMERIC(12, 2) DEFAULT 0,
    total_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    max_per_user INTEGER DEFAULT 10,
    description TEXT,
    sale_start TIMESTAMP WITH TIME ZONE,
    sale_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Seat Maps Table
CREATE TABLE IF NOT EXISTS seat_maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    layout_name TEXT NOT NULL,
    map_json JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Seats Table (Individual Seat Tracking)
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    map_id UUID REFERENCES seat_maps(id) ON DELETE CASCADE,
    block_name TEXT,
    row_name TEXT,
    seat_number TEXT,
    seat_status TEXT DEFAULT 'available', -- available, booked, blocked, reserved, vip_hold
    price NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    coupon_code TEXT NOT NULL,
    discount_type TEXT DEFAULT 'flat', -- flat, percentage
    discount_value NUMERIC(12, 2) DEFAULT 0,
    usage_limit INTEGER DEFAULT 100,
    current_usage INTEGER DEFAULT 0,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure event_id exists if coupons table was already created
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;

-- 6. Booked Seats (Linking bookings to specific seats)
CREATE TABLE IF NOT EXISTS booked_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for these tables
ALTER TABLE ticket_categories REPLICA IDENTITY FULL;
ALTER TABLE seat_maps REPLICA IDENTITY FULL;
ALTER TABLE seats REPLICA IDENTITY FULL;
ALTER TABLE booked_seats REPLICA IDENTITY FULL;

-- RLS Policies
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE booked_seats ENABLE ROW LEVEL SECURITY;

-- Public read for active events
CREATE POLICY "Public can view ticket categories" ON ticket_categories FOR SELECT USING (true);
CREATE POLICY "Public can view seat maps" ON seat_maps FOR SELECT USING (true);
CREATE POLICY "Public can view seats" ON seats FOR SELECT USING (true);
CREATE POLICY "Public can view coupons" ON coupons FOR SELECT USING (true);

-- Organiser access
CREATE POLICY "Organisers can manage their own ticket categories" ON ticket_categories
    FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE id = ticket_categories.event_id AND organiser_id = auth.uid()));

CREATE POLICY "Organisers can manage their own seat maps" ON seat_maps
    FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE id = seat_maps.event_id AND organiser_id = auth.uid()));

CREATE POLICY "Organisers can manage their own seats" ON seats
    FOR ALL USING (EXISTS (SELECT 1 FROM seat_maps sm JOIN events e ON sm.event_id = e.id WHERE sm.id = seats.map_id AND e.organiser_id = auth.uid()));

CREATE POLICY "Organisers can manage their own coupons" ON coupons
    FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE id = coupons.event_id AND organiser_id = auth.uid()));

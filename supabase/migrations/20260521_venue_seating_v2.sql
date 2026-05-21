-- Venue and Custom Seating Engine V2
-- Fully typed and manual seat map builder schema without layout dependency

-- Drop existing tables if they exist to prevent schema conflicts during recreation
DROP TABLE IF EXISTS seat_reservations CASCADE;
DROP TABLE IF EXISTS showtime_inventory CASCADE;
DROP TABLE IF EXISTS seating_boxes CASCADE;
DROP TABLE IF EXISTS seating_seats CASCADE;
DROP TABLE IF EXISTS seating_rows CASCADE;
DROP TABLE IF EXISTS seating_sections CASCADE;
DROP TABLE IF EXISTS seating_layouts CASCADE;

CREATE TABLE IF NOT EXISTS seating_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    layout_name VARCHAR(255) NOT NULL,
    layout_type VARCHAR(100),
    screen_label VARCHAR(255),
    total_capacity INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seating_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layout_id UUID REFERENCES seating_layouts(id) ON DELETE CASCADE,
    section_name VARCHAR(255) NOT NULL,
    section_type VARCHAR(100),
    base_price NUMERIC DEFAULT 0,
    color_code VARCHAR(20) DEFAULT '#fbbf24',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seating_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layout_id UUID REFERENCES seating_layouts(id) ON DELETE CASCADE,
    section_id UUID REFERENCES seating_sections(id) ON DELETE CASCADE,
    row_label VARCHAR(50) NOT NULL,
    seat_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seating_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layout_id UUID REFERENCES seating_layouts(id) ON DELETE CASCADE,
    section_id UUID REFERENCES seating_sections(id) ON DELETE CASCADE,
    row_id UUID REFERENCES seating_rows(id) ON DELETE CASCADE,
    seat_label VARCHAR(50) NOT NULL, -- e.g. A1, B12
    seat_number VARCHAR(50) NOT NULL,
    seat_type VARCHAR(50) DEFAULT 'standard', -- standard, premium, vip, etc.
    price NUMERIC, -- overrides section base_price if not null
    x_position NUMERIC NOT NULL DEFAULT 0,
    y_position NUMERIC NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'available', -- available, blocked, maintenance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(layout_id, seat_label)
);

CREATE TABLE IF NOT EXISTS seating_boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layout_id UUID REFERENCES seating_layouts(id) ON DELETE CASCADE,
    section_id UUID REFERENCES seating_sections(id) ON DELETE CASCADE,
    box_name VARCHAR(255) NOT NULL,
    seat_count INTEGER DEFAULT 0,
    price NUMERIC NOT NULL,
    box_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS showtime_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    showtime_id UUID, -- assuming event_showtimes table from previous logic, but will link correctly later if needed. For now just UUID.
    seat_id UUID REFERENCES seating_seats(id) ON DELETE CASCADE,
    availability_status VARCHAR(50) DEFAULT 'available',
    reserved_until TIMESTAMP WITH TIME ZONE,
    booking_id UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seat_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    seat_id UUID REFERENCES seating_seats(id) ON DELETE CASCADE,
    showtime_id UUID,
    reservation_token VARCHAR(255),
    status VARCHAR(50) DEFAULT 'reserved', -- reserved, released, converted, expired
    reserved_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist in case the tables were previously created with different structures
DO $$
BEGIN
    -- seating_layouts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_layouts' AND column_name = 'event_id') THEN
        ALTER TABLE seating_layouts ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_layouts' AND column_name = 'screen_label') THEN
        ALTER TABLE seating_layouts ADD COLUMN screen_label VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_layouts' AND column_name = 'total_capacity') THEN
        ALTER TABLE seating_layouts ADD COLUMN total_capacity INTEGER DEFAULT 0;
    END IF;

    -- seating_sections
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_sections' AND column_name = 'layout_id') THEN
        ALTER TABLE seating_sections ADD COLUMN layout_id UUID REFERENCES seating_layouts(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_sections' AND column_name = 'display_order') THEN
        ALTER TABLE seating_sections ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;

    -- seating_rows
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_rows' AND column_name = 'layout_id') THEN
        ALTER TABLE seating_rows ADD COLUMN layout_id UUID REFERENCES seating_layouts(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_rows' AND column_name = 'section_id') THEN
        ALTER TABLE seating_rows ADD COLUMN section_id UUID REFERENCES seating_sections(id) ON DELETE CASCADE;
    END IF;
    
    -- seating_seats
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_seats' AND column_name = 'layout_id') THEN
        ALTER TABLE seating_seats ADD COLUMN layout_id UUID REFERENCES seating_layouts(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_seats' AND column_name = 'section_id') THEN
        ALTER TABLE seating_seats ADD COLUMN section_id UUID REFERENCES seating_sections(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_seats' AND column_name = 'row_id') THEN
        ALTER TABLE seating_seats ADD COLUMN row_id UUID REFERENCES seating_rows(id) ON DELETE CASCADE;
    END IF;

    -- seating_boxes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_boxes' AND column_name = 'layout_id') THEN
        ALTER TABLE seating_boxes ADD COLUMN layout_id UUID REFERENCES seating_layouts(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seating_boxes' AND column_name = 'section_id') THEN
        ALTER TABLE seating_boxes ADD COLUMN section_id UUID REFERENCES seating_sections(id) ON DELETE CASCADE;
    END IF;

    -- drop policies if they exist before recreating
    DROP POLICY IF EXISTS "Public read layouts" ON seating_layouts;
    DROP POLICY IF EXISTS "Organizers manage layouts" ON seating_layouts;
    DROP POLICY IF EXISTS "Public read sections" ON seating_sections;
    DROP POLICY IF EXISTS "Organizers manage sections" ON seating_sections;
    DROP POLICY IF EXISTS "Public read rows" ON seating_rows;
    DROP POLICY IF EXISTS "Organizers manage rows" ON seating_rows;
    DROP POLICY IF EXISTS "Public read seats" ON seating_seats;
    DROP POLICY IF EXISTS "Organizers manage seats" ON seating_seats;
    DROP POLICY IF EXISTS "Public read boxes" ON seating_boxes;
    DROP POLICY IF EXISTS "Organizers manage boxes" ON seating_boxes;
    DROP POLICY IF EXISTS "Public read showtime inventory" ON showtime_inventory;
    DROP POLICY IF EXISTS "Public read seat reservations" ON seat_reservations;
    DROP POLICY IF EXISTS "Users manage own reservations" ON seat_reservations;

END $$;

-- Basic RLS
ALTER TABLE seating_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE seating_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE showtime_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read layouts" ON seating_layouts FOR SELECT USING (true);
CREATE POLICY "Organizers manage layouts" ON seating_layouts FOR ALL USING (EXISTS (SELECT 1 FROM events WHERE events.id = seating_layouts.event_id AND events.organiser_id = auth.uid()));

CREATE POLICY "Public read sections" ON seating_sections FOR SELECT USING (true);
CREATE POLICY "Organizers manage sections" ON seating_sections FOR ALL USING (EXISTS (SELECT 1 FROM seating_layouts JOIN events ON events.id = seating_layouts.event_id WHERE seating_layouts.id = seating_sections.layout_id AND events.organiser_id = auth.uid()));

CREATE POLICY "Public read rows" ON seating_rows FOR SELECT USING (true);
CREATE POLICY "Organizers manage rows" ON seating_rows FOR ALL USING (EXISTS (SELECT 1 FROM seating_layouts JOIN events ON events.id = seating_layouts.event_id WHERE seating_layouts.id = seating_rows.layout_id AND events.organiser_id = auth.uid()));

CREATE POLICY "Public read seats" ON seating_seats FOR SELECT USING (true);
CREATE POLICY "Organizers manage seats" ON seating_seats FOR ALL USING (EXISTS (SELECT 1 FROM seating_layouts JOIN events ON events.id = seating_layouts.event_id WHERE seating_layouts.id = seating_seats.layout_id AND events.organiser_id = auth.uid()));

CREATE POLICY "Public read boxes" ON seating_boxes FOR SELECT USING (true);
CREATE POLICY "Organizers manage boxes" ON seating_boxes FOR ALL USING (EXISTS (SELECT 1 FROM seating_layouts JOIN events ON events.id = seating_layouts.event_id WHERE seating_layouts.id = seating_boxes.layout_id AND events.organiser_id = auth.uid()));

CREATE POLICY "Public read showtime inventory" ON showtime_inventory FOR SELECT USING (true);
CREATE POLICY "Public read seat reservations" ON seat_reservations FOR SELECT USING (true);
CREATE POLICY "Users manage own reservations" ON seat_reservations FOR ALL USING (user_id = auth.uid());


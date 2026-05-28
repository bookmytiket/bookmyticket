-- Seating Engine Core Tables

-- 1. Seating Layouts (The top-level container for a venue's layout)
CREATE TABLE IF NOT EXISTS seating_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    venue_id UUID, -- Optional, if tied to a specific physical venue
    name VARCHAR(255) NOT NULL,
    blueprint_url TEXT, -- If uploaded an image/pdf
    canvas_width INTEGER DEFAULT 1000,
    canvas_height INTEGER DEFAULT 1000,
    status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Layout Versions (For draft/version control and rollbacks)
CREATE TABLE IF NOT EXISTS layout_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID REFERENCES seating_layouts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    layout_data JSONB NOT NULL, -- Full snapshot of the layout state
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Seating Sections/Zones (e.g., VIP, Gold, Balcony)
CREATE TABLE IF NOT EXISTS seating_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID REFERENCES seating_layouts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color_code VARCHAR(20) DEFAULT '#fbbf24', -- e.g., #fbbf24 for Gold
    capacity INTEGER NOT NULL DEFAULT 0,
    pricing_tier VARCHAR(100),
    is_accessible BOOLEAN DEFAULT FALSE,
    x_position NUMERIC DEFAULT 0,
    y_position NUMERIC DEFAULT 0,
    rotation NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Seating Rows (Optional grouping within a section)
CREATE TABLE IF NOT EXISTS seating_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES seating_sections(id) ON DELETE CASCADE,
    row_label VARCHAR(50) NOT NULL, -- e.g., 'A', 'B', 'AA'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Individual Seats
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES seating_sections(id) ON DELETE CASCADE,
    row_id UUID REFERENCES seating_rows(id) ON DELETE SET NULL,
    seat_label VARCHAR(50) NOT NULL, -- e.g., '1', '2', 'A1'
    x_position NUMERIC NOT NULL,
    y_position NUMERIC NOT NULL,
    is_accessible BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'available', -- available, reserved, blocked, maintenance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Real-time Seat Status (For live booking visualization & locking)
CREATE TABLE IF NOT EXISTS seat_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seat_id UUID REFERENCES seats(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(50) NOT NULL, -- available, locked_for_checkout, booked
    locked_by UUID, -- User ID who is currently in checkout
    locked_at TIMESTAMP WITH TIME ZONE,
    booking_id UUID, -- Link to final booking if booked
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Seat-to-Ticket Mapping (Connecting zones to inventory)
CREATE TABLE IF NOT EXISTS seat_ticket_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES seating_sections(id) ON DELETE CASCADE,
    ticket_type_id UUID, -- Assuming ticket_types table exists
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Seating Templates (Global library for organizers)
CREATE TABLE IF NOT EXISTS seating_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- cinema, stadium, banquet
    layout_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

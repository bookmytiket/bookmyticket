CREATE TABLE IF NOT EXISTS event_categories_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  icon TEXT,
  status TEXT DEFAULT 'active'
);

-- We don't alter events strictly to break things, just add category_id
ALTER TABLE events ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES event_categories_ref(id);

CREATE TABLE IF NOT EXISTS event_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES event_categories_ref(id),
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  required BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  reviewed_by UUID REFERENCES auth.users(id),
  status TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- For Early Bird Pricing in Marathons
CREATE TABLE IF NOT EXISTS race_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  distance TEXT,
  regular_price NUMERIC,
  early_bird_price NUMERIC,
  early_bird_start TIMESTAMPTZ,
  early_bird_end TIMESTAMPTZ,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrations might already exist, but user specified some columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pricing_type TEXT CHECK (pricing_type IN ('EARLY_BIRD', 'REGULAR'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS race_category_id UUID REFERENCES race_categories(id);

INSERT INTO event_categories_ref (category_name, icon, status) VALUES 
('Music Concerts', '🎵', 'active'),
('Marathons & Sports', '🏃', 'active'),
('College Events', '🎓', 'active'),
('Conferences & Seminars', '🎤', 'active'),
('Theatre & Cultural Shows', '🎭', 'active'),
('Festivals & Celebrations', '🎉', 'active'),
('Corporate Events', '🏢', 'active')
ON CONFLICT DO NOTHING;

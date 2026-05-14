-- Unified Organiser Event Master Schema Update
-- Enhancing the events table with visibility and status controls

-- 1. Add missing columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'event',
ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS visibility_status TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS listing_status TEXT DEFAULT 'active';

-- Update existing events to have correct defaults
UPDATE events SET entity_type = 'event' WHERE entity_type IS NULL;
UPDATE events SET publish_status = 'published' WHERE status = 'published' AND publish_status IS NULL;
UPDATE events SET visibility_status = 'public' WHERE visibility_status IS NULL;
UPDATE events SET approval_status = 'approved' WHERE approval_status IS NULL;
UPDATE events SET listing_status = 'active' WHERE listing_status IS NULL;

-- 2. Create home_page_sections table for dynamic placement
CREATE TABLE IF NOT EXISTS home_page_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL, -- 'Featured', 'Trending', 'Sports', etc.
    display_order INTEGER DEFAULT 0,
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create event_views table for tracking
CREATE TABLE IF NOT EXISTS event_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create event_likes table
CREATE TABLE IF NOT EXISTS event_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 5. Update RLS Policies
ALTER TABLE home_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view home page sections" ON home_page_sections;
CREATE POLICY "Public can view home page sections" ON home_page_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view event likes" ON event_likes;
CREATE POLICY "Public can view event likes" ON event_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like events" ON event_likes;
CREATE POLICY "Authenticated users can like events" ON event_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can record views" ON event_views;
CREATE POLICY "Public can record views" ON event_views FOR INSERT WITH CHECK (true);

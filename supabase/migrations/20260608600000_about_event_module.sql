-- ============================================================
-- About Event Module - Universal Rich Content Tables
-- ============================================================

-- 1. event_descriptions: Rich text content per event
CREATE TABLE IF NOT EXISTS event_descriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    overview text,
    special_note text,
    highlights jsonb DEFAULT '[]',
    rules text,
    terms text,
    benefits jsonb DEFAULT '[]',
    important_info jsonb DEFAULT '[]',
    schedule jsonb DEFAULT '[]',
    venue_info text,
    contact_info jsonb DEFAULT '{}',
    version integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(event_id)
);

-- 2. event_highlights: Icon + title pairs
CREATE TABLE IF NOT EXISTS event_highlights (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    icon text NOT NULL DEFAULT '🎖',
    title text NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 3. event_faqs: FAQ pairs per event
CREATE TABLE IF NOT EXISTS event_faqs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    question text NOT NULL,
    answer text NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_descriptions_event_id ON event_descriptions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_highlights_event_id ON event_highlights(event_id);
CREATE INDEX IF NOT EXISTS idx_event_faqs_event_id ON event_faqs(event_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_event_descriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.version = COALESCE(OLD.version, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_descriptions_updated_at ON event_descriptions;
CREATE TRIGGER trg_event_descriptions_updated_at
    BEFORE UPDATE ON event_descriptions
    FOR EACH ROW EXECUTE FUNCTION update_event_descriptions_updated_at();

-- RLS
ALTER TABLE event_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_faqs ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "event_descriptions_public_read" ON event_descriptions FOR SELECT USING (true);
CREATE POLICY "event_highlights_public_read" ON event_highlights FOR SELECT USING (true);
CREATE POLICY "event_faqs_public_read" ON event_faqs FOR SELECT USING (true);

-- Authenticated write (organiser will verify ownership in app layer)
CREATE POLICY "event_descriptions_auth_write" ON event_descriptions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "event_highlights_auth_write" ON event_highlights
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "event_faqs_auth_write" ON event_faqs
    FOR ALL USING (auth.role() = 'authenticated');

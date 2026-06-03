-- ============================================================
-- GENERIC TOURNAMENT MODULE — Master Initialization Script
-- ============================================================

-- Clean up any legacy/conflicting schemas first
DROP TABLE IF EXISTS public.tournament_sponsors CASCADE;
DROP TABLE IF EXISTS public.tournament_categories CASCADE;
DROP TABLE IF EXISTS public.tournament_registrations CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;

-- ── 1. tournaments ──────────────────────────────────────────────────────────
-- GENERIC TOURNAMENT MODULE — Production Migration
-- Creates generic tables for all sports tournaments
-- ============================================================

-- ── 1. tournaments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sport_type TEXT NOT NULL,
  tournament_name TEXT NOT NULL,
  slug TEXT UNIQUE,
  banner_url TEXT,
  poster_url TEXT,
  organizer_name TEXT,
  organizer_logo_url TEXT,
  venue TEXT,
  venue_address TEXT,
  google_map_url TEXT,
  description TEXT,
  terms_conditions TEXT,
  
  -- Config
  tournament_format TEXT,
  participation_type TEXT,
  registration_type TEXT,
  
  -- Schedule
  registration_open_date DATE,
  registration_close_date DATE,
  event_date DATE,
  reporting_time TEXT,
  start_time TEXT,
  
  -- Awards & Prizes
  winner_prize TEXT,
  runner_up_prize TEXT,
  semi_final_prize TEXT,
  has_trophy BOOLEAN DEFAULT FALSE,
  has_medal BOOLEAN DEFAULT FALSE,
  has_certificate BOOLEAN DEFAULT FALSE,
  has_participation_kit BOOLEAN DEFAULT FALSE,
  
  -- Requirements
  req_aadhaar BOOLEAN DEFAULT FALSE,
  req_school_id BOOLEAN DEFAULT FALSE,
  req_passport BOOLEAN DEFAULT FALSE,
  req_age_proof BOOLEAN DEFAULT FALSE,
  req_medical_certificate BOOLEAN DEFAULT FALSE,
  
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published tournaments" ON public.tournaments
  FOR SELECT USING (status = 'published' OR organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Organizers can manage tournaments" ON public.tournaments
  FOR ALL USING (organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ── 2. tournament_categories ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tournament_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  category_title TEXT NOT NULL,
  age_group TEXT,
  gender TEXT,
  registration_fee DECIMAL(10,2) DEFAULT 0,
  capacity INTEGER DEFAULT 128,
  prize_amount TEXT,
  category_description TEXT,
  slots_booked INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tournament_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tournament categories" ON public.tournament_categories FOR SELECT USING (TRUE);

CREATE POLICY "Organizers can manage tournament categories" ON public.tournament_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 3. tournament_registrations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.tournament_categories(id) ON DELETE SET NULL,
  participant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Dynamic form fields as JSONB (T-Shirt Size, Blood Group, Academy, Team Name, etc)
  dynamic_fields JSONB DEFAULT '{}',
  
  registration_fee DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  
  payment_status TEXT DEFAULT 'pending',
  registration_status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tournament registrations" ON public.tournament_registrations
  FOR SELECT USING (
    participant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can register" ON public.tournament_registrations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own registration" ON public.tournament_registrations
  FOR UPDATE USING (
    participant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. tournament_documents ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tournament_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  approval_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tournament_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own docs" ON public.tournament_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tournament_registrations r WHERE r.id = registration_id AND r.participant_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'organiser'))
  );

CREATE POLICY "Users upload docs" ON public.tournament_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tournament_registrations r WHERE r.id = registration_id AND r.participant_id = auth.uid())
  );

-- ── 5. tournament_sponsors ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tournament_sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  sponsor_type TEXT,
  sponsor_name TEXT NOT NULL,
  logo_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tournament_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view sponsors" ON public.tournament_sponsors FOR SELECT USING (TRUE);

CREATE POLICY "Organizers manage sponsors" ON public.tournament_sponsors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.organizer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Enable Realtime
DO $$
DECLARE
  t TEXT;
  tables_to_add TEXT[] := ARRAY[
    'tournaments',
    'tournament_categories',
    'tournament_registrations',
    'tournament_documents',
    'tournament_sponsors'
  ];
BEGIN
  FOREACH t IN ARRAY tables_to_add LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

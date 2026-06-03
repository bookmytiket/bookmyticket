-- ============================================================
-- BADMINTON CHAMPIONSHIP MODULE — Production Migration v2
-- Adds: badminton_events, badminton_categories, badminton_registrations,
--       badminton_player_documents, badminton_matches, badminton_sponsors,
--       badminton_notifications, badminton_checkins, badminton_results
-- NOTE: All tables prefixed with 'badminton_' to avoid conflicts with
--       existing sports_competition tables.
-- ============================================================

-- ── A. badminton_events ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badminton_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organiser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  slug TEXT,
  season TEXT,
  banner_url TEXT,
  organiser_name TEXT,
  organiser_logo_url TEXT,
  venue TEXT,
  venue_address TEXT,
  google_map_url TEXT,
  city TEXT,
  state TEXT,
  district TEXT,
  pincode TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  event_date DATE,
  event_end_date DATE,
  registration_deadline DATE,
  reg_start_date DATE,
  match_start_time TEXT,
  description TEXT,
  terms_conditions TEXT,
  whatsapp_link TEXT,
  support_number TEXT,
  highlight_feather_shuttle BOOLEAN DEFAULT FALSE,
  highlight_knockout BOOLEAN DEFAULT FALSE,
  highlight_participation_medal BOOLEAN DEFAULT FALSE,
  highlight_bai_rules BOOLEAN DEFAULT FALSE,
  highlight_live_scoring BOOLEAN DEFAULT FALSE,
  highlight_referee_monitoring BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'draft',
  publish_status TEXT DEFAULT 'draft',
  approval_status TEXT DEFAULT 'pending',
  dynamic_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique slug index
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'badminton_events'
      AND indexname = 'idx_badminton_events_slug'
  ) THEN
    CREATE UNIQUE INDEX idx_badminton_events_slug
      ON public.badminton_events(slug)
      WHERE slug IS NOT NULL;
  END IF;
END $$;

ALTER TABLE public.badminton_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published badminton events" ON public.badminton_events;
CREATE POLICY "Public can view published badminton events"
  ON public.badminton_events FOR SELECT
  USING (
    status = 'published'
    OR publish_status = 'published'
    OR organiser_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Organisers can manage badminton events" ON public.badminton_events;
CREATE POLICY "Organisers can manage badminton events"
  ON public.badminton_events FOR ALL
  USING (
    organiser_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Organisers can insert badminton events" ON public.badminton_events;
CREATE POLICY "Organisers can insert badminton events"
  ON public.badminton_events FOR INSERT
  WITH CHECK (
    organiser_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'organiser'))
  );

-- ── B. badminton_categories ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badminton_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.badminton_events(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  age_rule TEXT,
  gender TEXT DEFAULT 'Boys',
  registration_fee DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2) DEFAULT 20,
  gst_percent DECIMAL(5,2) DEFAULT 18,
  capacity INTEGER DEFAULT 128,
  winner_prize TEXT,
  runner_prize TEXT,
  semifinal_prize TEXT,
  trophy_included BOOLEAN DEFAULT FALSE,
  slots_booked INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.badminton_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view badminton categories" ON public.badminton_categories;
CREATE POLICY "Public can view badminton categories"
  ON public.badminton_categories FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Organisers can manage badminton categories" ON public.badminton_categories;
CREATE POLICY "Organisers can manage badminton categories"
  ON public.badminton_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.badminton_events e
      WHERE e.id = event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Organisers can insert badminton categories" ON public.badminton_categories;
CREATE POLICY "Organisers can insert badminton categories"
  ON public.badminton_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.badminton_events e
      WHERE e.id = event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ── C. badminton_registrations ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badminton_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_number TEXT,
  event_id UUID REFERENCES public.badminton_events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.badminton_categories(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  dob DATE,
  gender TEXT,
  address TEXT,
  district TEXT,
  state TEXT,
  pincode TEXT,
  academy_name TEXT,
  coach_name TEXT,
  player_ranking TEXT,
  shirt_size TEXT,
  registration_fee DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  payment_id TEXT,
  payment_gateway TEXT,
  verification_status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  registration_status TEXT DEFAULT 'confirmed',
  qr_code TEXT,
  check_in_status TEXT DEFAULT 'not_checked_in',
  checked_in_at TIMESTAMPTZ,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'badminton_registrations'
      AND indexname = 'idx_badminton_reg_number'
  ) THEN
    CREATE UNIQUE INDEX idx_badminton_reg_number
      ON public.badminton_registrations(registration_number)
      WHERE registration_number IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_badminton_reg_event    ON public.badminton_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_badminton_reg_user     ON public.badminton_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_badminton_reg_category ON public.badminton_registrations(category_id);

ALTER TABLE public.badminton_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badminton registrations" ON public.badminton_registrations;
CREATE POLICY "Users can view own badminton registrations"
  ON public.badminton_registrations FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.badminton_events e
      WHERE e.id = event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can insert badminton registrations" ON public.badminton_registrations;
CREATE POLICY "Users can insert badminton registrations"
  ON public.badminton_registrations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own badminton registrations" ON public.badminton_registrations;
CREATE POLICY "Users can update own badminton registrations"
  ON public.badminton_registrations FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.badminton_events e
      WHERE e.id = event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── D. badminton_player_documents (Age Verification) ─────────────────────────
-- Named badminton_player_documents to avoid conflict with participant_documents
CREATE TABLE IF NOT EXISTS public.badminton_player_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES public.badminton_registrations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  approval_status TEXT DEFAULT 'Pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badminton_docs_reg ON public.badminton_player_documents(registration_id);

ALTER TABLE public.badminton_player_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own badminton documents" ON public.badminton_player_documents;
CREATE POLICY "Users can view own badminton documents"
  ON public.badminton_player_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.badminton_registrations r
      WHERE r.id = registration_id
        AND r.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'organiser'))
  );

DROP POLICY IF EXISTS "Users can upload badminton documents" ON public.badminton_player_documents;
CREATE POLICY "Users can upload badminton documents"
  ON public.badminton_player_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.badminton_registrations r
      WHERE r.id = registration_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage badminton documents" ON public.badminton_player_documents;
CREATE POLICY "Admins can manage badminton documents"
  ON public.badminton_player_documents FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── E. badminton_matches (Tournament Draw & Fixtures) ────────────────────────
-- Named badminton_matches to avoid conflict with any existing tournament_matches
CREATE TABLE IF NOT EXISTS public.badminton_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.badminton_events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.badminton_categories(id) ON DELETE CASCADE,
  round_name TEXT NOT NULL,
  round_number INTEGER DEFAULT 1,
  match_number INTEGER,
  court TEXT,
  scheduled_time TEXT,
  player_one_id UUID REFERENCES public.badminton_registrations(id) ON DELETE SET NULL,
  player_one_name TEXT,
  player_two_id UUID REFERENCES public.badminton_registrations(id) ON DELETE SET NULL,
  player_two_name TEXT,
  winner_id UUID REFERENCES public.badminton_registrations(id) ON DELETE SET NULL,
  winner_name TEXT,
  score_player_one TEXT,
  score_player_two TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badminton_matches_event    ON public.badminton_matches(event_id);
CREATE INDEX IF NOT EXISTS idx_badminton_matches_category ON public.badminton_matches(category_id);

ALTER TABLE public.badminton_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view badminton matches" ON public.badminton_matches;
CREATE POLICY "Public can view badminton matches"
  ON public.badminton_matches FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Organisers can manage badminton matches" ON public.badminton_matches;
CREATE POLICY "Organisers can manage badminton matches"
  ON public.badminton_matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.badminton_events e
      WHERE e.id = event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── F. badminton_sponsors ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badminton_sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.badminton_events(id) ON DELETE CASCADE,
  sponsor_name TEXT NOT NULL,
  sponsor_type TEXT DEFAULT 'Gold Sponsor',
  logo_url TEXT,
  website_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badminton_sponsors_event ON public.badminton_sponsors(event_id);

ALTER TABLE public.badminton_sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view badminton sponsors" ON public.badminton_sponsors;
CREATE POLICY "Public can view badminton sponsors"
  ON public.badminton_sponsors FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Organisers can manage badminton sponsors" ON public.badminton_sponsors;
CREATE POLICY "Organisers can manage badminton sponsors"
  ON public.badminton_sponsors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.badminton_events e
      WHERE e.id = event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Organisers can insert badminton sponsors" ON public.badminton_sponsors;
CREATE POLICY "Organisers can insert badminton sponsors"
  ON public.badminton_sponsors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.badminton_events e
      WHERE e.id = event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── G. badminton_checkins ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badminton_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES public.badminton_registrations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.badminton_events(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.profiles(id),
  checkin_time TIMESTAMPTZ DEFAULT NOW(),
  attendance_status TEXT DEFAULT 'Present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badminton_checkins_event ON public.badminton_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_badminton_checkins_reg   ON public.badminton_checkins(registration_id);

ALTER TABLE public.badminton_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers and staff can manage badminton checkins" ON public.badminton_checkins;
CREATE POLICY "Organisers and staff can manage badminton checkins"
  ON public.badminton_checkins FOR ALL
  USING (
    staff_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.badminton_events e
      WHERE e.id = event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- ── H. badminton_notifications ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badminton_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.badminton_events(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  recipient_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.badminton_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers can manage badminton notifications" ON public.badminton_notifications;
CREATE POLICY "Organisers can manage badminton notifications"
  ON public.badminton_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.badminton_events e
      WHERE e.id = event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── I. badminton_results (Winners & Prizes) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badminton_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.badminton_events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.badminton_categories(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  registration_id UUID REFERENCES public.badminton_registrations(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  certificate_url TEXT,
  prize_amount DECIMAL(10,2) DEFAULT 0,
  announced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.badminton_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view badminton results" ON public.badminton_results;
CREATE POLICY "Public can view badminton results"
  ON public.badminton_results FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Organisers can manage badminton results" ON public.badminton_results;
CREATE POLICY "Organisers can manage badminton results"
  ON public.badminton_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.badminton_events e
      WHERE e.id = event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── J. Additional Indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_badminton_events_organiser ON public.badminton_events(organiser_id);
CREATE INDEX IF NOT EXISTS idx_badminton_events_status    ON public.badminton_events(status);

-- ── K. Enable Realtime ────────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  tables_to_add TEXT[] := ARRAY[
    'badminton_events',
    'badminton_categories',
    'badminton_registrations',
    'badminton_player_documents',
    'badminton_matches',
    'badminton_sponsors',
    'badminton_checkins',
    'badminton_notifications',
    'badminton_results'
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

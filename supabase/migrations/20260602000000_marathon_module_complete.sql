-- ============================================================
-- MARATHON MODULE COMPLETE — Production Migration
-- Adds: slug, logo, reporting_time, early bird pricing,
--       identity docs, check-ins, notifications, enhanced
--       registration fields, bib series, prize amounts
-- ============================================================

-- ── A. Enhance marathon_events ───────────────────────────────────────────────
ALTER TABLE public.marathon_events
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS reporting_time TEXT,
  ADD COLUMN IF NOT EXISTS registration_deadline DATE,
  ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
  ADD COLUMN IF NOT EXISTS organiser_name TEXT,
  ADD COLUMN IF NOT EXISTS reg_start_date DATE,
  ADD COLUMN IF NOT EXISTS reg_end_date DATE,
  ADD COLUMN IF NOT EXISTS whatsapp_link TEXT,
  ADD COLUMN IF NOT EXISTS support_number TEXT,
  ADD COLUMN IF NOT EXISTS event_end_date DATE,
  ADD COLUMN IF NOT EXISTS event_end_time TEXT;

-- Unique slug index (safe if constraint already exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='marathon_events' AND indexname='idx_marathon_events_slug') THEN
    CREATE UNIQUE INDEX idx_marathon_events_slug ON public.marathon_events(slug) WHERE slug IS NOT NULL;
  END IF;
END $$;

-- ── B. Enhance marathon_categories (Early Bird + Bib + Prize) ────────────────
ALTER TABLE public.marathon_categories
  ADD COLUMN IF NOT EXISTS bib_series TEXT,
  ADD COLUMN IF NOT EXISTS prize_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_bird_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS early_bird_start DATE,
  ADD COLUMN IF NOT EXISTS early_bird_end DATE,
  ADD COLUMN IF NOT EXISTS distance_unit TEXT DEFAULT 'KM',
  ADD COLUMN IF NOT EXISTS available_slots INTEGER;

-- Sync available_slots dynamically based on existing columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_categories' AND column_name='slots_total') THEN
    EXECUTE 'UPDATE public.marathon_categories SET available_slots = GREATEST(0, COALESCE(slots_total, 100) - COALESCE(slots_booked, 0)) WHERE available_slots IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_categories' AND column_name='total_slots') THEN
    EXECUTE 'UPDATE public.marathon_categories SET available_slots = COALESCE(slots, 100) WHERE available_slots IS NULL';
  ELSE
    EXECUTE 'UPDATE public.marathon_categories SET available_slots = 100 WHERE available_slots IS NULL';
  END IF;
END $$;

-- ── C. Enhance marathon_registrations ───────────────────────────────────────
ALTER TABLE public.marathon_registrations
  ADD COLUMN IF NOT EXISTS registration_id TEXT,
  ADD COLUMN IF NOT EXISTS blood_group TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS running_club TEXT,
  ADD COLUMN IF NOT EXISTS tshirt_size TEXT,
  ADD COLUMN IF NOT EXISTS qr_code TEXT,
  ADD COLUMN IF NOT EXISTS bib_number TEXT,
  ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Unique registration_id index
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='marathon_registrations' AND indexname='idx_marathon_reg_registration_id') THEN
    CREATE UNIQUE INDEX idx_marathon_reg_registration_id ON public.marathon_registrations(registration_id) WHERE registration_id IS NOT NULL;
  END IF;
END $$;

-- ── D. marathon_documents (Identity Verification) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.marathon_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.marathon_registrations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'Aadhaar', 'Passport', 'Driving License', 'School ID', 'College ID'
  document_url TEXT NOT NULL,
  verification_status TEXT DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marathon_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own documents" ON public.marathon_documents;
CREATE POLICY "Users can view their own documents"
  ON public.marathon_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marathon_registrations r
      WHERE r.id = marathon_documents.registration_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organisers can view documents for their events" ON public.marathon_documents;
CREATE POLICY "Organisers can view documents for their events"
  ON public.marathon_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marathon_registrations r
      JOIN public.marathon_events e ON e.id = r.marathon_id
      WHERE r.id = marathon_documents.registration_id
        AND e.organiser_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can upload their own documents" ON public.marathon_documents;
CREATE POLICY "Users can upload their own documents"
  ON public.marathon_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.marathon_registrations r
      WHERE r.id = marathon_documents.registration_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all documents" ON public.marathon_documents;
CREATE POLICY "Admins can manage all documents"
  ON public.marathon_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── E. marathon_checkins ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marathon_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.marathon_registrations(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.profiles(id),
  checkin_time TIMESTAMPTZ DEFAULT NOW(),
  kit_issued BOOLEAN DEFAULT FALSE,
  attendance_status TEXT DEFAULT 'Present', -- 'Present', 'DNS'
  notes TEXT,
  scan_location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marathon_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage checkins for their organiser" ON public.marathon_checkins;
CREATE POLICY "Staff can manage checkins for their organiser"
  ON public.marathon_checkins FOR ALL
  USING (
    staff_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'organiser'))
  );

DROP POLICY IF EXISTS "Participants can view their own checkins" ON public.marathon_checkins;
CREATE POLICY "Participants can view their own checkins"
  ON public.marathon_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.marathon_registrations r
      WHERE r.id = marathon_checkins.registration_id
        AND r.user_id = auth.uid()
    )
  );

-- ── F. marathon_notifications ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marathon_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.marathon_events(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'new_event', 'registration_confirmation', 'reminder', 'checkin_reminder'
  recipient_type TEXT NOT NULL,    -- 'all_users', 'registered_participants', 'running_clubs', 'subscribers'
  channel TEXT NOT NULL,           -- 'email', 'whatsapp', 'push'
  status TEXT DEFAULT 'pending',   -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marathon_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers can manage notifications for their events" ON public.marathon_notifications;
CREATE POLICY "Organisers can manage notifications for their events"
  ON public.marathon_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.marathon_events e
      WHERE e.id = marathon_notifications.event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── G. runner_registrations table (used by existing /api/runner-registration) ──
CREATE TABLE IF NOT EXISTS public.runner_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  dob TEXT,
  gender TEXT,
  category TEXT,
  tshirt_size TEXT,
  custom_fields JSONB DEFAULT '{}',
  status TEXT DEFAULT 'confirmed',
  payment_status TEXT DEFAULT 'paid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.runner_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own runner registrations" ON public.runner_registrations;
CREATE POLICY "Users can view own runner registrations"
  ON public.runner_registrations FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own runner registrations" ON public.runner_registrations;
CREATE POLICY "Users can insert own runner registrations"
  ON public.runner_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Organisers can view registrations for their events" ON public.runner_registrations;
CREATE POLICY "Organisers can view registrations for their events"
  ON public.runner_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = runner_registrations.event_id
        AND e.organiser_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── H. Indexes for performance ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_marathon_docs_registration ON public.marathon_documents(registration_id);
CREATE INDEX IF NOT EXISTS idx_marathon_checkins_registration ON public.marathon_checkins(registration_id);
CREATE INDEX IF NOT EXISTS idx_marathon_notifications_event ON public.marathon_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_marathon_regs_marathon ON public.marathon_registrations(marathon_id);
CREATE INDEX IF NOT EXISTS idx_marathon_regs_user ON public.marathon_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_runner_regs_event ON public.runner_registrations(event_id);

-- ── I. Enable Realtime on new tables ─────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  tables_to_add TEXT[] := ARRAY['marathon_documents', 'marathon_checkins', 'marathon_notifications'];
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

-- ============================================================
-- BookMyTicket — Row Level Security (RLS) Migration
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EVENTS TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Clean slate
DROP POLICY IF EXISTS "Organisers can manage their own events"  ON public.events;
DROP POLICY IF EXISTS "Admins can view all events"              ON public.events;
DROP POLICY IF EXISTS "Public can view published events"        ON public.events;
DROP POLICY IF EXISTS "Anyone can read published events"        ON public.events;

-- Organisers: full CRUD on own events only
CREATE POLICY "Organisers can manage their own events"
  ON public.events FOR ALL
  TO authenticated
  USING  (organiser_id = auth.uid())
  WITH CHECK (organiser_id = auth.uid());

-- Admins: read all events
CREATE POLICY "Admins can view all events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'system_admin')
    )
  );

-- Public (anon + authenticated): read published/active events for homepage
CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT
  USING (publish_status = 'published' OR listing_status = 'active');

-- ─────────────────────────────────────────────────────────────
-- 2. TOURNAMENT_EVENTS TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.tournament_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers manage own tournament events" ON public.tournament_events;
DROP POLICY IF EXISTS "Public view tournament events"           ON public.tournament_events;

-- Organisers: manage via parent event ownership
CREATE POLICY "Organisers manage own tournament events"
  ON public.tournament_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = tournament_events.event_id
        AND e.organiser_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = tournament_events.event_id
        AND e.organiser_id = auth.uid()
    )
  );

-- Public: read all tournament details
CREATE POLICY "Public view tournament events"
  ON public.tournament_events FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- 3. MARATHON_EVENTS TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.marathon_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers manage own marathon events" ON public.marathon_events;
DROP POLICY IF EXISTS "Public view marathon events"           ON public.marathon_events;

CREATE POLICY "Organisers manage own marathon events"
  ON public.marathon_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = marathon_events.event_id
        AND e.organiser_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = marathon_events.event_id
        AND e.organiser_id = auth.uid()
    )
  );

CREATE POLICY "Public view marathon events"
  ON public.marathon_events FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- 4. TOURNAMENT_CATEGORIES TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.tournament_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers manage own tournament categories" ON public.tournament_categories;
DROP POLICY IF EXISTS "Public view tournament categories"          ON public.tournament_categories;

CREATE POLICY "Organisers manage own tournament categories"
  ON public.tournament_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = tournament_categories.event_id
        AND e.organiser_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = tournament_categories.event_id
        AND e.organiser_id = auth.uid()
    )
  );

CREATE POLICY "Public view tournament categories"
  ON public.tournament_categories FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- 5. BOOKINGS TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers can view own event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings"            ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings"           ON public.bookings;

-- Organisers see bookings for their events
CREATE POLICY "Organisers can view own event bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = bookings.event_id
        AND e.organiser_id = auth.uid()
    )
  );

-- Buyers see their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR ALL
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins see all bookings
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'system_admin')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 6. ORGANISERS TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.organisers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers view own profile"   ON public.organisers;
DROP POLICY IF EXISTS "Organisers update own profile" ON public.organisers;
DROP POLICY IF EXISTS "Admins view all organisers"    ON public.organisers;

CREATE POLICY "Organisers view own profile"
  ON public.organisers FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Organisers update own profile"
  ON public.organisers FOR UPDATE
  TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins view all organisers"
  ON public.organisers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'system_admin')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 7. STAFF TABLE
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers manage own staff" ON public.staff;

CREATE POLICY "Organisers manage own staff"
  ON public.staff FOR ALL
  TO authenticated
  USING  (organiser_id = auth.uid())
  WITH CHECK (organiser_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- VERIFY: Check RLS is enabled on key tables
-- ─────────────────────────────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('events','tournament_events','marathon_events',
                    'tournament_categories','bookings','organisers','staff')
ORDER BY tablename;

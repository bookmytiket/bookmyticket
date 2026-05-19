
-- Migration to unify event status and add timestamp columns for easier filtering
-- This migration ensures compliance with the Organiser Dashboard requirements.

-- 1. Ensure columns exist (some might already exist from previous partial migrations)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'draft';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS listing_status TEXT DEFAULT 'active';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS visibility_status TEXT DEFAULT 'public';

-- 2. Add explicit timestamp columns for reliable sorting and expiry logic
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_start_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_end_at TIMESTAMPTZ;

-- 3. Backfill publish_status from the legacy 'status' column if it's currently null
UPDATE public.events 
SET publish_status = LOWER(status) 
WHERE publish_status IS NULL OR publish_status = 'draft';

-- 4. Set listing_status based on status if needed
UPDATE public.events 
SET listing_status = 'active' 
WHERE listing_status IS NULL;

UPDATE public.events 
SET listing_status = 'archived' 
WHERE status = 'archived' OR status = 'deleted';

-- 5. Attempt to backfill timestamps from date/time strings (best effort)
-- Note: format depends on how dates were stored. Assuming YYYY-MM-DD and HH:MM
UPDATE public.events 
SET event_start_at = (date || ' ' || COALESCE(time, '00:00:00'))::TIMESTAMPTZ 
WHERE event_start_at IS NULL AND date IS NOT NULL;

UPDATE public.events 
SET event_end_at = (COALESCE(end_date, date) || ' ' || COALESCE(end_time, '23:59:59'))::TIMESTAMPTZ 
WHERE event_end_at IS NULL AND (date IS NOT NULL OR end_date IS NOT NULL);

-- 6. Add indexes for performance on the organiser dashboard
CREATE INDEX IF NOT EXISTS idx_events_organiser_publish_status ON public.events(organiser_id, publish_status);
CREATE INDEX IF NOT EXISTS idx_events_listing_status ON public.events(listing_status);
CREATE INDEX IF NOT EXISTS idx_events_end_at ON public.events(event_end_at);

-- 7. Ensure RLS allows organisers to see their own events (including drafts and archived)
-- Note: This assumes 'organisers' table maps auth.users.id to its own id or is used as a proxy.
-- The user mentioned: auth.users.id -> organisers.user_id -> events.organiser_id
-- However, existing code uses events.organiser_id directly against user.id.
-- We'll ensure the policies are broad enough for the organiser.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'events' AND policyname = 'Organisers can manage their own events'
    ) THEN
        CREATE POLICY "Organisers can manage their own events" ON public.events
        FOR ALL USING (organiser_id = auth.uid());
    END IF;
END $$;

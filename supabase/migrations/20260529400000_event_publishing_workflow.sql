-- BookMyTicket Event Publishing Workflow Schema
-- Adds support for Draft -> Pending Review -> Approved -> Published

-- 1. Update events table with status columns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
-- status can be: draft, pending_review, approved, rejected, changes_requested, published, archived, expired
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS publish_status VARCHAR(50) DEFAULT 'unpublished';
-- publish_status can be: unpublished, published

-- 2. Event Drafts (for saving incomplete events)
CREATE TABLE IF NOT EXISTS public.event_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    draft_json JSONB NOT NULL,
    completion_percentage INT DEFAULT 0,
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Event Reviews (for Admin review process)
CREATE TABLE IF NOT EXISTS public.event_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_status VARCHAR(50) NOT NULL, -- approved, rejected, changes_requested
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Event Status History
CREATE TABLE IF NOT EXISTS public.event_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Realtime Sync for New Tables (Already added to publication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.event_drafts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.event_reviews;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.event_status_history;

-- RLS Policies
ALTER TABLE public.event_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizers can read their drafts" ON public.event_drafts;
DROP POLICY IF EXISTS "Organizers can read their drafts" ON public.event_drafts;
CREATE POLICY "Organizers can read their drafts" ON public.event_drafts FOR SELECT USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_drafts.event_id AND events.organiser_id = auth.uid()));
DROP POLICY IF EXISTS "Organizers can insert drafts" ON public.event_drafts;
DROP POLICY IF EXISTS "Organizers can insert drafts" ON public.event_drafts;
CREATE POLICY "Organizers can insert drafts" ON public.event_drafts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_drafts.event_id AND events.organiser_id = auth.uid()));
DROP POLICY IF EXISTS "Organizers can update their drafts" ON public.event_drafts;
DROP POLICY IF EXISTS "Organizers can update their drafts" ON public.event_drafts;
CREATE POLICY "Organizers can update their drafts" ON public.event_drafts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_drafts.event_id AND events.organiser_id = auth.uid()));
DROP POLICY IF EXISTS "Admin full access drafts" ON public.event_drafts;
DROP POLICY IF EXISTS "Admin full access drafts" ON public.event_drafts;
CREATE POLICY "Admin full access drafts" ON public.event_drafts FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizers can read reviews for their events" ON public.event_reviews;
DROP POLICY IF EXISTS "Organizers can read reviews for their events" ON public.event_reviews;
CREATE POLICY "Organizers can read reviews for their events" ON public.event_reviews FOR SELECT USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_reviews.event_id AND events.organiser_id = auth.uid()));
DROP POLICY IF EXISTS "Admin full access reviews" ON public.event_reviews;
DROP POLICY IF EXISTS "Admin full access reviews" ON public.event_reviews;
CREATE POLICY "Admin full access reviews" ON public.event_reviews FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

ALTER TABLE public.event_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizers can read status history for their events" ON public.event_status_history;
DROP POLICY IF EXISTS "Organizers can read status history for their events" ON public.event_status_history;
CREATE POLICY "Organizers can read status history for their events" ON public.event_status_history FOR SELECT USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_status_history.event_id AND events.organiser_id = auth.uid()));
DROP POLICY IF EXISTS "Admin full access status history" ON public.event_status_history;
DROP POLICY IF EXISTS "Admin full access status history" ON public.event_status_history;
CREATE POLICY "Admin full access status history" ON public.event_status_history FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Triggers for History tracking (Optional but recommended)
CREATE OR REPLACE FUNCTION track_event_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.event_status_history (event_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_track_event_status ON public.events;
CREATE TRIGGER trigger_track_event_status
    AFTER UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION track_event_status_change();

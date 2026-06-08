-- RLS for Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizers can view own events" ON public.events;
CREATE POLICY "Organizers can view own events" ON public.events
    FOR ALL USING (organiser_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')));

-- RLS for Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organizers can view own event bookings" ON public.bookings;
CREATE POLICY "Organizers can view own event bookings" ON public.bookings
    FOR ALL USING (event_id IN (SELECT id FROM events WHERE organiser_id = auth.uid()) OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')));

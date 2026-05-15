-- ============================================================
-- BookMyTicket — Staff Role Data Access (RLS)
-- ============================================================

-- 1. Helper function to check if user is staff for a specific organiser
CREATE OR REPLACE FUNCTION public.is_staff_of(target_organiser_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff
    WHERE staff.auth_user_id = auth.uid()
      AND staff.organiser_id = target_organiser_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. EVENTS: Allow staff to view events of their organiser
CREATE POLICY "Staff can view organiser events" ON public.events
    FOR SELECT TO authenticated 
    USING (public.is_staff_of(organiser_id));

-- 3. BOOKINGS: Allow staff to view/update bookings for their organiser's events
CREATE POLICY "Staff can view organiser bookings" ON public.bookings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = bookings.event_id 
              AND public.is_staff_of(events.organiser_id)
        )
    );

CREATE POLICY "Staff can update organiser bookings" ON public.bookings
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = bookings.event_id 
              AND public.is_staff_of(events.organiser_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE events.id = bookings.event_id 
              AND public.is_staff_of(events.organiser_id)
        )
    );

-- 4. TICKETS: Allow staff to verify tickets
ALTER TABLE IF EXISTS public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view/verify tickets" ON public.tickets
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.events e ON e.id = b.event_id
            WHERE b.id = tickets.booking_id
              AND (e.organiser_id = auth.uid() OR public.is_staff_of(e.organiser_id))
        )
    );

-- 5. SCANNER LOGS: Allow staff to create logs
CREATE POLICY "Staff can manage scanner logs" ON public.scanner_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = scanner_logs.event_id
              AND (e.organiser_id = auth.uid() OR public.is_staff_of(e.organiser_id))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = scanner_logs.event_id
              AND (e.organiser_id = auth.uid() OR public.is_staff_of(e.organiser_id))
        )
    );

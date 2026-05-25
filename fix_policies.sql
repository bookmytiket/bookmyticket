-- 1. Update ticket_scan_logs table with new approval fields
ALTER TABLE public.ticket_scan_logs ADD COLUMN IF NOT EXISTS approval_status TEXT; -- 'approved', 'rejected', 'pending'
ALTER TABLE public.ticket_scan_logs ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Update tickets table with reentry logic
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS checkin_status TEXT DEFAULT 'pending'; -- 'pending', 'checked_in', 'rejected'
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS reentry_count INTEGER DEFAULT 0;

-- 3. Create id_verification_logs table
CREATE TABLE IF NOT EXISTS public.id_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    staff_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    id_type TEXT,
    id_number_masked TEXT,
    verification_status TEXT, -- 'Verified', 'Mismatch', 'Rejected'
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.id_verification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for staff to id_verification_logs" ON public.id_verification_logs FOR ALL USING (true);

-- 4. Create event_verification_settings table
CREATE TABLE IF NOT EXISTS public.event_verification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
    require_id_verification BOOLEAN DEFAULT false,
    allow_reentry BOOLEAN DEFAULT false,
    max_reentry INTEGER DEFAULT 0,
    accepted_id_types JSONB DEFAULT '["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.event_verification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all" ON public.event_verification_settings FOR SELECT USING (true);
CREATE POLICY "Enable write access for organisers" ON public.event_verification_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = event_verification_settings.event_id 
        AND events.organiser_id = auth.uid()
    )
);

-- Notify pgrst to reload schema
NOTIFY pgrst, 'reload schema';
ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_inventory;

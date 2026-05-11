-- Redesigned Staff Access Control System
-- 1. Update existing staff table with new restricted access fields
ALTER TABLE IF EXISTS public.staff 
ADD COLUMN IF NOT EXISTS mobile TEXT,
ADD COLUMN IF NOT EXISTS assigned_event_id UUID REFERENCES public.events(id),
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;

-- 2. Create ticket_scans table for detailed history
CREATE TABLE IF NOT EXISTS public.ticket_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    scanned_by UUID REFERENCES auth.users(id),
    gate_name TEXT,
    scan_status TEXT, -- 'Valid', 'Already Used', 'Invalid QR', 'Cancelled'
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create duplicate_scan_logs for fraud prevention
CREATE TABLE IF NOT EXISTS public.duplicate_scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    first_scan_time TIMESTAMP WITH TIME ZONE,
    duplicate_scan_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    device_id TEXT,
    scanned_by UUID REFERENCES auth.users(id)
);

-- 4. Create ticket_validation_logs for all attempts
CREATE TABLE IF NOT EXISTS public.ticket_validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id TEXT, -- Can be UUID or raw text from QR
    validation_status TEXT,
    scanner_device TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_validation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organisers can see scans for their events
CREATE POLICY "Organisers can view scans for their events" ON public.ticket_scans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.events e ON b.event_id = e.id
            WHERE b.id = ticket_id AND (e.organiser_id = auth.uid() OR e.organiser_id::text = auth.uid()::text)
        )
    );

-- Staff can insert scans
CREATE POLICY "Staff can insert scans" ON public.ticket_scans
    FOR INSERT WITH CHECK (true);

-- Similar policies for other tables
CREATE POLICY "Organisers can view duplicate logs" ON public.duplicate_scan_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings b
            JOIN public.events e ON b.event_id = e.id
            WHERE b.id = ticket_id AND (e.organiser_id = auth.uid() OR e.organiser_id::text = auth.uid()::text)
        )
    );

CREATE POLICY "Staff can insert duplicate logs" ON public.duplicate_scan_logs
    FOR INSERT WITH CHECK (true);

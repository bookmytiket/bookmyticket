-- Create ticket_scan_logs table
CREATE TABLE IF NOT EXISTS public.ticket_scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    ticket_code TEXT,
    scanned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    scan_status TEXT NOT NULL, -- 'Success', 'Duplicate', 'Invalid', 'Expired', 'Wrong Event'
    gate_name TEXT,
    device_info JSONB,
    raw_payload TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on ticket_scan_logs
ALTER TABLE public.ticket_scan_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for event staff" ON public.ticket_scan_logs;
CREATE POLICY "Enable read access for event staff" ON public.ticket_scan_logs
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.ticket_scan_logs;
CREATE POLICY "Enable insert for authenticated users" ON public.ticket_scan_logs
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable all access for service role" ON public.ticket_scan_logs;
CREATE POLICY "Enable all access for service role" ON public.ticket_scan_logs
    FOR ALL USING (true);

-- Create scanner_devices table
CREATE TABLE IF NOT EXISTS public.scanner_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_name TEXT,
    device_uuid TEXT UNIQUE,
    authorized_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'authorized', -- 'authorized', 'revoked'
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on scanner_devices
ALTER TABLE public.scanner_devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for scanner_devices" ON public.scanner_devices;
CREATE POLICY "Enable read access for scanner_devices" ON public.scanner_devices
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all access for service role" ON public.scanner_devices;
CREATE POLICY "Enable all access for service role" ON public.scanner_devices
    FOR ALL USING (true);

-- Create event_access_control table
CREATE TABLE IF NOT EXISTS public.event_access_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'scanner_staff', -- 'scanner_staff', 'admin'
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Enable RLS on event_access_control
ALTER TABLE public.event_access_control ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for event_access_control" ON public.event_access_control;
CREATE POLICY "Enable read access for event_access_control" ON public.event_access_control
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable all access for service role" ON public.event_access_control;
CREATE POLICY "Enable all access for service role" ON public.event_access_control
    FOR ALL USING (true);

-- Add columns to tickets table if they do not exist
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS scanned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS gate_name TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Notify pgrst to reload schema
NOTIFY pgrst, 'reload schema';

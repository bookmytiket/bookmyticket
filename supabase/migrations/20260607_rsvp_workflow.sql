CREATE TABLE IF NOT EXISTS public.rsvp_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.admin_events(id) ON DELETE CASCADE,
    capacity INT NOT NULL DEFAULT 0,
    registration_open DATE,
    registration_close DATE,
    waitlist_enabled BOOLEAN DEFAULT FALSE,
    auto_confirm BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.rsvp_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.admin_events(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text',
    required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.rsvp_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.admin_events(id) ON DELETE CASCADE,
    user_id UUID,
    registration_id TEXT UNIQUE NOT NULL,
    qr_code TEXT,
    status TEXT DEFAULT 'Registered', -- Registered, Checked-In, Cancelled, Waitlisted
    user_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.rsvp_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id TEXT REFERENCES public.rsvp_registrations(registration_id) ON DELETE CASCADE,
    checked_in_by UUID,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE public.rsvp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvp_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for rsvp_events" ON public.rsvp_events FOR SELECT USING (true);
CREATE POLICY "Allow public read for rsvp_fields" ON public.rsvp_fields FOR SELECT USING (true);
CREATE POLICY "Allow public insert for rsvp_registrations" ON public.rsvp_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read for own rsvp_registrations" ON public.rsvp_registrations FOR SELECT USING (true);
CREATE POLICY "Allow updates for own registrations" ON public.rsvp_registrations FOR UPDATE USING (true);
CREATE POLICY "Allow public read checkins" ON public.rsvp_checkins FOR SELECT USING (true);


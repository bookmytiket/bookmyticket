CREATE TABLE IF NOT EXISTS public.event_amenities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
    ambulance BOOLEAN DEFAULT false,
    cash_prize BOOLEAN DEFAULT false,
    certificate BOOLEAN DEFAULT false,
    cycle BOOLEAN DEFAULT false,
    family BOOLEAN DEFAULT false,
    checkin BOOLEAN DEFAULT false,
    first_aid BOOLEAN DEFAULT false,
    accommodation BOOLEAN DEFAULT false,
    breakfast BOOLEAN DEFAULT false,
    medal BOOLEAN DEFAULT false,
    bib BOOLEAN DEFAULT false,
    outdoor BOOLEAN DEFAULT false,
    parking_fcfs BOOLEAN DEFAULT false,
    refreshments BOOLEAN DEFAULT false,
    safety_enabled BOOLEAN DEFAULT false,
    selfie BOOLEAN DEFAULT false,
    shield BOOLEAN DEFAULT false,
    suitable_all BOOLEAN DEFAULT false,
    trophy BOOLEAN DEFAULT false,
    tshirt BOOLEAN DEFAULT false,
    wash_room BOOLEAN DEFAULT false,
    valet BOOLEAN DEFAULT false,
    wifi BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.virtual_event_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
    chat_enabled BOOLEAN DEFAULT false,
    recording_enabled BOOLEAN DEFAULT false,
    qa_enabled BOOLEAN DEFAULT false,
    hd_enabled BOOLEAN DEFAULT false,
    allow_mic BOOLEAN DEFAULT false,
    allow_video BOOLEAN DEFAULT false,
    allow_screen BOOLEAN DEFAULT false,
    meeting_password TEXT,
    visibility TEXT DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.event_amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view event amenities" ON public.event_amenities FOR SELECT USING (true);
CREATE POLICY "Organizers manage event amenities" ON public.event_amenities FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_amenities.event_id AND events.organiser_id = auth.uid())
);

ALTER TABLE public.virtual_event_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view virtual event configs" ON public.virtual_event_configs FOR SELECT USING (true);
CREATE POLICY "Organizers manage virtual event configs" ON public.virtual_event_configs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = virtual_event_configs.event_id AND events.organiser_id = auth.uid())
);

NOTIFY pgrst, 'reload schema';

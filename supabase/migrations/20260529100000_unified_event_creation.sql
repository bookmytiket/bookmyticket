-- Migration: Unified Event Creation

-- 1. Add new columns to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_mode VARCHAR(50) DEFAULT 'paid';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- 2. Event Media Table
CREATE TABLE IF NOT EXISTS public.event_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    banner_url TEXT,
    poster_url TEXT,
    gallery_urls JSONB DEFAULT '[]'::jsonb,
    promo_video_url TEXT,
    organizer_logo TEXT,
    sponsor_logo TEXT,
    partner_logo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Event Terms Table
CREATE TABLE IF NOT EXISTS public.event_terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    refund_policy TEXT,
    entry_rules TEXT,
    restrictions TEXT,
    age_policy TEXT,
    id_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Free Registrations Table
CREATE TABLE IF NOT EXISTS public.free_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    registration_status VARCHAR(50) DEFAULT 'confirmed',
    ticket_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view event media" ON public.event_media FOR SELECT USING (true);
CREATE POLICY "Organizers manage event media" ON public.event_media FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_media.event_id AND events.organiser_id = auth.uid()));

ALTER TABLE public.event_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view event terms" ON public.event_terms FOR SELECT USING (true);
CREATE POLICY "Organizers manage event terms" ON public.event_terms FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_terms.event_id AND events.organiser_id = auth.uid()));

ALTER TABLE public.free_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own registrations" ON public.free_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create registrations" ON public.free_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Organizers view event registrations" ON public.free_registrations FOR SELECT USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = free_registrations.event_id AND events.organiser_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.free_registrations;

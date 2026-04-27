-- Migration to support detailed Sports Event configurations

-- 1. Marathon Config
CREATE TABLE IF NOT EXISTS public.marathon_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    distance_options JSONB DEFAULT '[]',
    age_min INT4,
    age_max INT4,
    tshirt_enabled BOOLEAN DEFAULT FALSE,
    tshirt_sizes JSONB DEFAULT '[]',
    route_map_url TEXT,
    prize_details TEXT,
    hydration_support BOOLEAN DEFAULT FALSE,
    medical_support BOOLEAN DEFAULT FALSE,
    amenities JSONB DEFAULT '[]',
    distance_pricing JSONB DEFAULT '{}',
    age_pricing JSONB DEFAULT '{}',
    category_configs JSONB DEFAULT '{}', -- { '5K': { gender: 'Both', prizes: '...' } }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tournament Config
CREATE TABLE IF NOT EXISTS public.tournament_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    teams_count INT4,
    match_type TEXT,
    schedule_json JSONB DEFAULT '[]',
    rules TEXT,
    venue_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Coaching Config
CREATE TABLE IF NOT EXISTS public.coaching_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    trainer_name TEXT,
    trainer_experience TEXT,
    trainer_certification TEXT,
    slots_json JSONB DEFAULT '[]',
    capacity INT4,
    duration TEXT,
    price FLOAT8,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.marathon_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_config ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Organisers can manage own marathon_config" ON public.marathon_config;
    DROP POLICY IF EXISTS "Everyone can view marathon_config" ON public.marathon_config;
    DROP POLICY IF EXISTS "Organisers can manage own tournament_config" ON public.tournament_config;
    DROP POLICY IF EXISTS "Everyone can view tournament_config" ON public.tournament_config;
    DROP POLICY IF EXISTS "Organisers can manage own coaching_config" ON public.coaching_config;
    DROP POLICY IF EXISTS "Everyone can view coaching_config" ON public.coaching_config;
END $$;

-- Create Policies
CREATE POLICY "Organisers can manage own marathon_config" ON public.marathon_config 
FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE id = marathon_config.event_id AND (organiser_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')));

CREATE POLICY "Everyone can view marathon_config" ON public.marathon_config FOR SELECT USING (true);

CREATE POLICY "Organisers can manage own tournament_config" ON public.tournament_config 
FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE id = tournament_config.event_id AND (organiser_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')));

CREATE POLICY "Everyone can view tournament_config" ON public.tournament_config FOR SELECT USING (true);

CREATE POLICY "Organisers can manage own coaching_config" ON public.coaching_config 
FOR ALL USING (EXISTS (SELECT 1 FROM public.events WHERE id = coaching_config.event_id AND (organiser_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')));

CREATE POLICY "Everyone can view coaching_config" ON public.coaching_config FOR SELECT USING (true);

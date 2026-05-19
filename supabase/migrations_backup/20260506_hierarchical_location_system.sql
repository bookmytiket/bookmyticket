-- Migration: Hierarchical Location Management System
-- This implements a structured global location hierarchy: Country -> State -> District -> City.

-- 1. Create Countries Table
CREATE TABLE IF NOT EXISTS public.countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    flag TEXT, -- Emoji or URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create States Table
CREATE TABLE IF NOT EXISTS public.states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(country_id, name)
);

-- 3. Create Districts Table
CREATE TABLE IF NOT EXISTS public.districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(state_id, name)
);

-- 4. Create Cities Table
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pincode TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(district_id, name)
);

-- 5. Create User Locations Table
CREATE TABLE IF NOT EXISTS public.user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    country_id UUID REFERENCES public.countries(id),
    state_id UUID REFERENCES public.states(id),
    district_id UUID REFERENCES public.districts(id),
    city_id UUID REFERENCES public.cities(id),
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.countries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.districts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;

-- 7. Add RLS Policies
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Enable read access for all" ON public.states FOR SELECT USING (true);
CREATE POLICY "Enable read access for all" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Enable read access for all" ON public.cities FOR SELECT USING (true);

CREATE POLICY "Users can manage their own locations" ON public.user_locations
FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 8. Seed Initial Data (India)
DO $$
DECLARE
    india_id UUID;
    tn_id UUID;
    ka_id UUID;
    ke_id UUID;
    cbe_dist_id UUID;
    che_dist_id UUID;
    blr_dist_id UUID;
    koc_dist_id UUID;
BEGIN
    -- India
    INSERT INTO public.countries (name, code, flag) 
    VALUES ('India', 'IN', '🇮🇳') 
    ON CONFLICT (name) DO UPDATE SET code = EXCLUDED.code 
    RETURNING id INTO india_id;

    -- States
    INSERT INTO public.states (country_id, name) VALUES (india_id, 'Tamil Nadu') ON CONFLICT DO NOTHING;
    INSERT INTO public.states (country_id, name) VALUES (india_id, 'Karnataka') ON CONFLICT DO NOTHING;
    INSERT INTO public.states (country_id, name) VALUES (india_id, 'Kerala') ON CONFLICT DO NOTHING;

    SELECT id INTO tn_id FROM public.states WHERE name = 'Tamil Nadu' AND country_id = india_id;
    SELECT id INTO ka_id FROM public.states WHERE name = 'Karnataka' AND country_id = india_id;
    SELECT id INTO ke_id FROM public.states WHERE name = 'Kerala' AND country_id = india_id;

    -- Districts (Tamil Nadu)
    INSERT INTO public.districts (state_id, name) VALUES (tn_id, 'Coimbatore') ON CONFLICT DO NOTHING;
    INSERT INTO public.districts (state_id, name) VALUES (tn_id, 'Chennai') ON CONFLICT DO NOTHING;
    INSERT INTO public.districts (state_id, name) VALUES (tn_id, 'Madurai') ON CONFLICT DO NOTHING;

    SELECT id INTO cbe_dist_id FROM public.districts WHERE name = 'Coimbatore' AND state_id = tn_id;
    SELECT id INTO che_dist_id FROM public.districts WHERE name = 'Chennai' AND state_id = tn_id;

    -- Districts (Karnataka)
    INSERT INTO public.districts (state_id, name) VALUES (ka_id, 'Bangalore') ON CONFLICT DO NOTHING;
    SELECT id INTO blr_dist_id FROM public.districts WHERE name = 'Bangalore' AND state_id = ka_id;

    -- Districts (Kerala)
    INSERT INTO public.districts (state_id, name) VALUES (ke_id, 'Kochi') ON CONFLICT DO NOTHING;
    SELECT id INTO koc_dist_id FROM public.districts WHERE name = 'Kochi' AND state_id = ke_id;

    -- Cities (Coimbatore)
    INSERT INTO public.cities (district_id, name, pincode) VALUES (cbe_dist_id, 'Coimbatore North', '641001') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (cbe_dist_id, 'RS Puram', '641002') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (cbe_dist_id, 'Gandhipuram', '641012') ON CONFLICT DO NOTHING;

    -- Cities (Chennai)
    INSERT INTO public.cities (district_id, name, pincode) VALUES (che_dist_id, 'T Nagar', '600017') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (che_dist_id, 'Anna Nagar', '600040') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (che_dist_id, 'Velachery', '600042') ON CONFLICT DO NOTHING;

    -- Cities (Bangalore)
    INSERT INTO public.cities (district_id, name, pincode) VALUES (blr_dist_id, 'Indiranagar', '560038') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (blr_dist_id, 'Koramangala', '560034') ON CONFLICT DO NOTHING;

    -- Cities (Kochi)
    INSERT INTO public.cities (district_id, name, pincode) VALUES (koc_dist_id, 'Ernakulam', '682011') ON CONFLICT DO NOTHING;
    INSERT INTO public.cities (district_id, name, pincode) VALUES (koc_dist_id, 'Fort Kochi', '682001') ON CONFLICT DO NOTHING;
END $$;

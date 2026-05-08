-- MARATHON SYSTEM V2: IMAGE-BASED PUBLISHING & DYNAMIC PAGES
-- This migration sets up the dedicated tables for the advanced marathon system.

-- 1. Marathon Events Table (Extends basic event info with marathon-specific fields)
CREATE TABLE IF NOT EXISTS public.marathon_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organiser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    awareness_text TEXT, -- e.g. "Autism Awareness Marathon"
    banner_image TEXT NOT NULL, -- Main poster
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    venue TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT,
    state TEXT NOT NULL,
    country TEXT DEFAULT 'India',
    zip_code TEXT,
    map_location JSONB, -- { lat, lng, address }
    route_map_image TEXT,
    starting_point TEXT,
    status TEXT DEFAULT 'Draft', -- 'Draft', 'Published', 'Completed', 'Cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Marathon Categories (KM & Age based pricing)
CREATE TABLE IF NOT EXISTS public.marathon_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marathon_id UUID REFERENCES public.marathon_events(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL, -- e.g. "10KM Run"
    distance_km DECIMAL NOT NULL,
    age_group TEXT NOT NULL, -- e.g. "Open", "16+ yrs", "5-10 yrs"
    gender_category TEXT DEFAULT 'All', -- 'Men', 'Women', 'All', 'Boys', 'Girls'
    price DECIMAL NOT NULL DEFAULT 0,
    slots_total INTEGER NOT NULL DEFAULT 100,
    slots_booked INTEGER NOT NULL DEFAULT 0,
    requirements TEXT, -- e.g. "Aadhar card mandatory"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Schema Evolution: Add marathon_id to marathon_categories if it was previously created with event_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_categories' AND column_name='marathon_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_categories' AND column_name='event_id') THEN
            ALTER TABLE public.marathon_categories RENAME COLUMN event_id TO marathon_id;
        ELSE
            ALTER TABLE public.marathon_categories ADD COLUMN marathon_id UUID REFERENCES public.marathon_events(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 3. Marathon Sponsors
CREATE TABLE IF NOT EXISTS public.marathon_sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marathon_id UUID REFERENCES public.marathon_events(id) ON DELETE CASCADE,
    sponsor_name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    sponsor_type TEXT DEFAULT 'Partner', -- 'Title', 'Powered By', 'Associate', 'Media', 'Hydration'
    rank_order INTEGER DEFAULT 0
);

-- 4. Marathon Benefits
CREATE TABLE IF NOT EXISTS public.marathon_benefits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marathon_id UUID REFERENCES public.marathon_events(id) ON DELETE CASCADE,
    benefit_name TEXT NOT NULL, -- e.g. "T-Shirts"
    icon_key TEXT, -- e.g. "tshirt", "medal", "apple"
    description TEXT
);

-- 5. Marathon Registrations (Bookings)
CREATE TABLE IF NOT EXISTS public.marathon_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    marathon_id UUID REFERENCES public.marathon_events(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.marathon_categories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    participant_name TEXT NOT NULL,
    participant_email TEXT NOT NULL,
    participant_phone TEXT NOT NULL,
    participant_age INTEGER,
    participant_gender TEXT,
    tshirt_size TEXT, -- 'S', 'M', 'L', 'XL', 'XXL'
    payment_status TEXT DEFAULT 'Pending', -- 'Pending', 'Paid', 'Failed'
    payment_id TEXT, -- Razorpay/Cashfree ID
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}' -- For custom fields like 'Aadhar No'
);

-- Schema Evolution: Add marathon_id to marathon_registrations if it was previously created with event_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_registrations' AND column_name='marathon_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_registrations' AND column_name='event_id') THEN
            ALTER TABLE public.marathon_registrations RENAME COLUMN event_id TO marathon_id;
        ELSE
            ALTER TABLE public.marathon_registrations ADD COLUMN marathon_id UUID REFERENCES public.marathon_events(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- ENABLE RLS
ALTER TABLE public.marathon_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marathon_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marathon_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marathon_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marathon_registrations ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Anyone can view published marathons" ON public.marathon_events FOR SELECT USING (status = 'Published');
CREATE POLICY "Organisers can manage their own marathons" ON public.marathon_events FOR ALL USING (auth.uid() = organiser_id);

CREATE POLICY "Anyone can view marathon categories" ON public.marathon_categories FOR SELECT USING (true);
CREATE POLICY "Organisers can manage categories" ON public.marathon_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM public.marathon_events WHERE id = marathon_id AND organiser_id = auth.uid())
);

CREATE POLICY "Anyone can view sponsors" ON public.marathon_sponsors FOR SELECT USING (true);
CREATE POLICY "Anyone can view benefits" ON public.marathon_benefits FOR SELECT USING (true);

CREATE POLICY "Users can view their own registrations" ON public.marathon_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organisers can view registrations for their marathons" ON public.marathon_registrations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.marathon_events WHERE id = marathon_id AND organiser_id = auth.uid())
);

-- ENABLE REALTIME
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Check if tables are already in publication before adding
DO $$
DECLARE
    table_name_var TEXT;
    tables_to_add TEXT[] := ARRAY['marathon_events', 'marathon_categories', 'marathon_registrations'];
BEGIN
    FOREACH table_name_var IN ARRAY tables_to_add LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = table_name_var
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name_var);
        END IF;
    END LOOP;
END $$;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_marathon_events_updated_at
    BEFORE UPDATE ON public.marathon_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

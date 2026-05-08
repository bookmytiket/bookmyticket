-- 20260508_unified_publishing_system.sql
-- Migration to support the Unified Event and Service Publishing System

--------------------------------------------------------------------------------
-- 1. SERVICES TABLE
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    price FLOAT8,
    currency TEXT DEFAULT 'INR',
    city TEXT,
    state TEXT,
    country TEXT,
    images TEXT[], -- Array of image URLs
    status TEXT DEFAULT 'Draft', -- 'Published', 'Draft', 'Under Review'
    metadata JSONB DEFAULT '{}', -- Flexible field for extra details
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Services are viewable by everyone." ON public.services FOR SELECT USING (true);
CREATE POLICY "Providers can manage own services." ON public.services FOR ALL USING (provider_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

--------------------------------------------------------------------------------
-- 2. EVENT TICKETS TABLE (Normalization)
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.event_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    ticket_name TEXT NOT NULL,
    ticket_price FLOAT8 NOT NULL,
    quantity INT4, -- NULL for unlimited
    sold_count INT4 DEFAULT 0,
    gst_percentage FLOAT8 DEFAULT 18,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tickets are viewable by everyone." ON public.event_tickets FOR SELECT USING (true);
CREATE POLICY "Organisers can manage own tickets." ON public.event_tickets FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organiser_id = auth.uid()) 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

--------------------------------------------------------------------------------
-- 3. ENHANCEMENTS TO EVENTS TABLE
--------------------------------------------------------------------------------

-- Ensure slug and SEO fields exist
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gallery TEXT[];
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sponsor_logos JSONB DEFAULT '[]';

-- Create an auto-slug function if not already present
CREATE OR REPLACE FUNCTION public.generate_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_event_slug
BEFORE INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION public.generate_event_slug();

--------------------------------------------------------------------------------
-- 4. SERVICE PACKAGES (Normalized from JSONB if needed)
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.service_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price FLOAT8 NOT NULL,
    description TEXT,
    features TEXT[],
    duration TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packages viewable by everyone." ON public.service_packages FOR SELECT USING (true);
CREATE POLICY "Providers can manage own packages." ON public.service_packages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.services WHERE id = service_id AND provider_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Ensure we have a clean slate for the new schema
DROP TABLE IF EXISTS public.event_branding CASCADE;
DROP TABLE IF EXISTS public.event_sponsors CASCADE;
DROP TABLE IF EXISTS public.sponsors CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;

-- Create sponsors table
CREATE TABLE public.sponsors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partners table
CREATE TABLE public.partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_branding table
CREATE TABLE public.event_branding (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    show_on_event_page BOOLEAN DEFAULT true,
    show_on_ticket BOOLEAN DEFAULT true,
    show_on_invoice BOOLEAN DEFAULT true,
    show_on_email BOOLEAN DEFAULT true,
    show_on_mobile BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check constraint to ensure either sponsor_id or partner_id is provided
ALTER TABLE public.event_branding 
ADD CONSTRAINT check_sponsor_or_partner 
CHECK (sponsor_id IS NOT NULL OR partner_id IS NOT NULL);

-- Enable RLS
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_branding ENABLE ROW LEVEL SECURITY;

-- Policies for Sponsors (Admin Only for mutation)
CREATE POLICY "Sponsors are publicly viewable" 
    ON public.sponsors FOR SELECT 
    USING (status = 'active');

CREATE POLICY "Admins can manage sponsors" 
    ON public.sponsors FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Policies for Partners (Admin Only for mutation)
CREATE POLICY "Partners are publicly viewable" 
    ON public.partners FOR SELECT 
    USING (status = 'active');

CREATE POLICY "Admins can manage partners" 
    ON public.partners FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Policies for Event Branding (Admin Only for mutation, Public for read)
CREATE POLICY "Event branding is publicly viewable" 
    ON public.event_branding FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage event branding" 
    ON public.event_branding FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Function to update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_sponsors_updated_at ON public.sponsors;
CREATE TRIGGER update_sponsors_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

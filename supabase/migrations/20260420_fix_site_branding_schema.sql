-- Add missing and new columns to site_branding table
ALTER TABLE public.site_branding ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'BookMyTicket';
ALTER TABLE public.site_branding ADD COLUMN IF NOT EXISTS logo_color TEXT DEFAULT '#111111';
ALTER TABLE public.site_branding ADD COLUMN IF NOT EXISTS site_url TEXT;
ALTER TABLE public.site_branding ADD COLUMN IF NOT EXISTS powered_by_logo_url TEXT;
ALTER TABLE public.site_branding ADD COLUMN IF NOT EXISTS powered_by_link TEXT;

-- Insert a default row if the table is empty
INSERT INTO public.site_branding (name, logo_url, logo_color, site_url)
SELECT 'BookMyTicket', '/logo.png', '#111111', 'https://www.bookmyticket.net'
WHERE NOT EXISTS (SELECT 1 FROM public.site_branding);

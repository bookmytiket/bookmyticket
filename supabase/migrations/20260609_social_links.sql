-- Migration: Social Links System
-- Description: Creates the social_links table and analytics tracking table for community promotion

CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    url TEXT,
    icon_url TEXT,
    is_enabled BOOLEAN DEFAULT true,
    show_in_navbar BOOLEAN DEFAULT false,
    show_in_footer BOOLEAN DEFAULT true,
    show_on_event_page BOOLEAN DEFAULT true,
    show_on_booking_success BOOLEAN DEFAULT true,
    clicks_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Public can read
CREATE POLICY "Public can view active social links" 
ON public.social_links FOR SELECT 
USING (is_enabled = true);

-- Admins can do everything
CREATE POLICY "Admins have full access to social links" 
ON public.social_links FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
    )
);

-- Insert defaults for WhatsApp and Instagram
INSERT INTO public.social_links (platform, title, url, icon_url, show_in_navbar, show_in_footer, show_on_event_page, show_on_booking_success)
VALUES 
    ('whatsapp', 'WhatsApp Channel', '', 'whatsapp', true, true, true, true),
    ('instagram', 'Instagram Community', '', 'instagram', true, true, true, true)
ON CONFLICT (platform) DO NOTHING;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_social_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_social_links
BEFORE UPDATE ON public.social_links
FOR EACH ROW
EXECUTE FUNCTION update_social_links_updated_at();

-- Analytics tracking table
CREATE TABLE IF NOT EXISTS public.social_clicks_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    source TEXT, -- 'navbar', 'footer', 'widget', 'event_page', 'success_page'
    clicked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_clicks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert click logs" 
ON public.social_clicks_log FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view click logs" 
ON public.social_clicks_log FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
    )
);

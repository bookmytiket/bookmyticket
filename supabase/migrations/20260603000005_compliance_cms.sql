-- ============================================================
-- COMPLIANCE & CMS MODULE — Production Migration
-- Creates tables for public pages, contact form, and company settings
-- ============================================================

-- ── 1. cms_pages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT UNIQUE NOT NULL,
  page_title TEXT NOT NULL,
  page_content TEXT,
  status TEXT DEFAULT 'published',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published cms pages" ON public.cms_pages;
CREATE POLICY "Public can view published cms pages" ON public.cms_pages
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage cms pages" ON public.cms_pages;
CREATE POLICY "Admins can manage cms pages" ON public.cms_pages
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Insert Default Pages
INSERT INTO public.cms_pages (page_key, page_title, page_content) VALUES
('about-us', 'About Us', 'BookMyTicket is an online event ticketing and registration platform that helps organizers create, manage, promote, and sell tickets for events across India. Our platform supports sports tournaments, marathons, cultural programs, concerts, workshops, conferences, exhibitions, community events, and more. With secure online payments, digital QR tickets, real-time attendee management, organizer dashboards, and mobile app support, BookMyTicket simplifies the complete event registration and ticketing process for both organizers and participants.'),
('terms-and-conditions', 'Terms & Conditions', 'By using BookMyTicket, you agree to comply with our platform policies and event guidelines. Users are responsible for providing accurate registration information and following organizer instructions. Event organizers are responsible for event execution, scheduling, venue management, and participant communication. BookMyTicket serves as a technology platform for event registration and ticketing services.'),
('privacy-policy', 'Privacy Policy', 'Your privacy is important to us. We collect only the information required to provide ticketing, registration, customer support, payment processing, and event management services. We do not sell personal information to third parties. User data is protected through industry-standard security measures and is used solely for platform operations and service improvements.'),
('refund-policy', 'Refund & Cancellation Policy', 'Refunds and cancellations are subject to the organizer''s event policy. If an event is cancelled or postponed, refund eligibility will be determined by the organizer and applicable payment regulations. BookMyTicket acts as a ticketing platform and facilitates communication between organizers and participants regarding refund requests.'),
('organizer-information', 'Organizer Information', 'BookMyTicket enables organizers to create events, manage registrations, sell tickets, verify attendees through QR code scanning, and track event performance through analytics. Organizers must complete required verification procedures, provide accurate event information, and comply with applicable laws, regulations, and platform policies before publishing events.')
ON CONFLICT (page_key) DO NOTHING;

-- ── 2. contact_enquiries ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert contact enquiries" ON public.contact_enquiries;
CREATE POLICY "Public can insert contact enquiries" ON public.contact_enquiries
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage contact enquiries" ON public.contact_enquiries;
CREATE POLICY "Admins can manage contact enquiries" ON public.contact_enquiries
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- ── 3. company_settings ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT DEFAULT 'BookMyTicket',
  support_email TEXT DEFAULT 'hello@bookmyticket.net',
  support_phone TEXT,
  office_address TEXT,
  website_url TEXT DEFAULT 'https://www.bookmyticket.net',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view company settings" ON public.company_settings;
CREATE POLICY "Public can view company settings" ON public.company_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage company settings" ON public.company_settings;
CREATE POLICY "Admins can manage company settings" ON public.company_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Insert Default Settings
INSERT INTO public.company_settings (company_name, support_email, website_url) VALUES
('BookMyTicket', 'hello@bookmyticket.net', 'https://www.bookmyticket.net')
ON CONFLICT DO NOTHING;

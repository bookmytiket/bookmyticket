-- Create dedicated table for contact page settings
CREATE TABLE IF NOT EXISTS public.contact_settings (
    id SERIAL PRIMARY KEY,
    header_title TEXT,
    header_description TEXT,
    support_email TEXT,
    support_phone TEXT,
    sales_india TEXT,
    sales_uae TEXT,
    sales_singapore TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    address_line3 TEXT,
    address_pincode TEXT,
    hours_mon_fri TEXT,
    hours_sat TEXT,
    hours_sun TEXT,
    social_linkedin TEXT,
    social_instagram TEXT,
    social_facebook TEXT,
    social_twitter TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial data
INSERT INTO public.contact_settings (
    id, header_title, header_description, support_email, support_phone,
    sales_india, sales_uae, sales_singapore,
    address_line1, address_line2, address_line3, address_pincode,
    hours_mon_fri, hours_sat, hours_sun,
    social_linkedin, social_instagram, social_facebook, social_twitter
) VALUES (
    1, 'Get in Support', 'Have a general question for us? We''re here to help with any inquiries about our services.',
    'support@bookmyticket.net', '+91 90420 29927',
    '+91 97907 62727', '+971 55 747 2927', '+60 14-210 7199',
    '4th Floor, Ramani''s West Gate,', 'No: 402C, Viswanathapuram,', 'Thudiyalur, Coimbatore, Tamil Nadu', '641034',
    '9:30 AM - 6:30 PM IST', '9:30 AM - 1:30 PM IST', 'We''re offline ( Day Off )',
    '#', '#', '#', '#'
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.contact_settings;
CREATE POLICY "Allow public read access" ON public.contact_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin all access" ON public.contact_settings;
CREATE POLICY "Allow admin all access" ON public.contact_settings FOR ALL USING (public.is_admin(auth.uid()));

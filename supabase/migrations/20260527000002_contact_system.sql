-- Table: contact_otps
CREATE TABLE IF NOT EXISTS public.contact_otps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text,
    phone text,
    otp text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: contact_inquiries
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    company text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    query_type text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: contact_settings
CREATE TABLE IF NOT EXISTS public.contact_settings (
    id bigint PRIMARY KEY,
    header_title text,
    header_description text,
    support_email text,
    support_phone text,
    sales_india text,
    sales_uae text,
    sales_singapore text,
    address_line1 text,
    address_line2 text,
    address_line3 text,
    address_pincode text,
    hours_mon_fri text,
    hours_sat text,
    hours_sun text,
    social_linkedin text,
    social_instagram text,
    social_facebook text,
    social_twitter text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.contact_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

-- Policies for public inserts
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.contact_otps;
CREATE POLICY "Enable insert access for all users" ON public.contact_otps FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.contact_inquiries;
CREATE POLICY "Enable insert access for all users" ON public.contact_inquiries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON public.contact_settings;
CREATE POLICY "Enable read access for all users" ON public.contact_settings FOR SELECT USING (true);

-- Provide initial default configuration for contact_settings if it's empty
INSERT INTO public.contact_settings (
    id, header_title, header_description, support_email, support_phone, 
    sales_india, sales_uae, sales_singapore, address_line1, address_line2, 
    address_line3, address_pincode, hours_mon_fri, hours_sat, hours_sun, 
    social_linkedin, social_instagram, social_facebook, social_twitter
)
VALUES (
    1, 
    'Get in Touch', 
    'Have a general question for us? We''re here to help with any inquiries about our services.',
    'hello@bookmyticket.net',
    '+91 90420 29927',
    '+91 97907 62727',
    '+971 55 747 2927',
    '+60 14-210 7199',
    '4th Floor, Ramani''s West Gate,',
    'No: 402C, Viswanathapuram,',
    'Thudiyalur, Coimbatore, Tamil Nadu',
    '641034',
    '9:30 AM - 6:30 PM IST',
    '9:30 AM - 1:30 PM IST',
    'We''re offline ( Day Off )',
    '#', '#', '#', '#'
) ON CONFLICT (id) DO NOTHING;

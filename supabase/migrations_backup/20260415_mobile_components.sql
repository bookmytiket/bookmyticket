-- Create checkout_footers table
CREATE TABLE IF NOT EXISTS public."checkout_footers" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mobile_banners table
CREATE TABLE IF NOT EXISTS public."mobile_banners" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    videoUrl TEXT NOT NULL,
    title TEXT,
    subtitle TEXT,
    ctaText TEXT,
    ctaLink TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional seeding data for feature parity demonstration
INSERT INTO public."checkout_footers" (title, description, icon) VALUES 
('Secure Payment', 'Your transaction is completely encrypted over SSL', 'ShieldCheck'),
('100% Guaranteed', 'Authentic booking backed by BookMyTicket protections', 'CheckCircle');

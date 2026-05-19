-- Premium Staff Access Management System
-- 1. Create staff_packages table
CREATE TABLE IF NOT EXISTS public.staff_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name TEXT NOT NULL,
    staff_limit INTEGER NOT NULL DEFAULT 3,
    package_price NUMERIC NOT NULL DEFAULT 0,
    features JSONB DEFAULT '{"offline_scan": false, "multi_gate": false, "analytics": false}'::jsonb,
    duration_days INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create organiser_subscriptions table
CREATE TABLE IF NOT EXISTS public.organiser_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organiser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.staff_packages(id),
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'active', 'expired'
    active_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Update staff table for device restriction
ALTER TABLE IF EXISTS public.staff 
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- 4. Create device_sessions table for single device login restriction
CREATE TABLE IF NOT EXISTS public.device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    login_status TEXT DEFAULT 'active', -- 'active', 'logged_out'
    last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create payment_transactions for subscription tracking
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organiser_id UUID REFERENCES auth.users(id),
    package_id UUID REFERENCES public.staff_packages(id),
    amount NUMERIC NOT NULL,
    payment_gateway TEXT, -- 'Razorpay', 'Cashfree'
    transaction_id TEXT UNIQUE,
    payment_status TEXT, -- 'success', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organiser_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view staff packages" ON public.staff_packages FOR SELECT USING (true);

CREATE POLICY "Organisers can view their own subscriptions" ON public.organiser_subscriptions
    FOR SELECT USING (auth.uid() = organiser_id);

CREATE POLICY "Staff can manage their own device sessions" ON public.device_sessions
    FOR ALL USING (auth.uid() = staff_id);

CREATE POLICY "Organisers can view their transactions" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = organiser_id);

-- Seed Default Packages
INSERT INTO public.staff_packages (package_name, staff_limit, package_price, features)
VALUES 
('Free Plan', 3, 0, '{"offline_scan": false, "multi_gate": false, "analytics": false, "duplicate_validation": true}'),
('Starter Plan', 10, 999, '{"offline_scan": true, "multi_gate": true, "analytics": false, "duplicate_validation": true}'),
('Professional Plan', 25, 2999, '{"offline_scan": true, "multi_gate": true, "analytics": true, "duplicate_validation": true}'),
('Enterprise Plan', 9999, 9999, '{"offline_scan": true, "multi_gate": true, "analytics": true, "duplicate_validation": true, "device_monitoring": true}')
ON CONFLICT DO NOTHING;

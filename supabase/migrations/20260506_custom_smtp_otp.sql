-- OTP Email Workflow & SMTP Settings

-- 1. Ensure email_settings table exists with all required fields
CREATE TABLE IF NOT EXISTS public.email_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT DEFAULT 'SMTP', -- 'SMTP', 'MICROSOFT_365'
    host TEXT,
    port INTEGER DEFAULT 587,
    encryption TEXT DEFAULT 'TLS', -- 'TLS', 'SSL', 'NONE'
    user_name TEXT,
    pass TEXT,
    from_email TEXT DEFAULT 'hello@bookmyticket.net',
    from_name TEXT DEFAULT 'BookMyTicket',
    microsoft_365 JSONB DEFAULT '{}', -- For OAuth settings if needed
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a default placeholder if empty
INSERT INTO public.email_settings (id, provider, from_email, from_name)
SELECT gen_random_uuid(), 'SMTP', 'hello@bookmyticket.net', 'BookMyTicket'
WHERE NOT EXISTS (SELECT 1 FROM public.email_settings);

-- 2. Create OTPS table for manual verification
-- DROP TABLE IF EXISTS public.otps; -- Uncomment if you want to force recreate
CREATE TABLE IF NOT EXISTS public.otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL UNIQUE, -- Email or Phone (Unique for upsert)
    code TEXT NOT NULL,
    purpose TEXT DEFAULT 'signup',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table existed with old columns, we might need to add identifier manually
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'otps' AND column_name = 'identifier') THEN
        DROP TABLE IF EXISTS public.otps;
        CREATE TABLE public.otps (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            identifier TEXT NOT NULL UNIQUE,
            code TEXT NOT NULL,
            purpose TEXT DEFAULT 'signup',
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Index for fast lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_otps_identifier ON public.otps(identifier);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON public.otps(expires_at);

-- 3. RLS for security
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;

-- Only admins can see/edit email settings
CREATE POLICY "Admins can manage email settings" ON public.email_settings
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'))
    WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- OTPS table is system-only (no direct public access)
CREATE POLICY "No public access to OTPS" ON public.otps
    FOR ALL USING (false);

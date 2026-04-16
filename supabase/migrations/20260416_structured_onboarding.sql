-- Migration: Structured Partner Onboarding Support
-- Created: 2026-04-16

-- 1. Add force_password_change flag to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='force_password_change') THEN
        ALTER TABLE public.profiles ADD COLUMN force_password_change BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Create Notifications Log table
CREATE TABLE IF NOT EXISTS public.notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'Email', 'SMS'
    recipient VARCHAR(255) NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Sent', -- 'Sent', 'Failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create KYC Details table (more structured than JSONB)
CREATE TABLE IF NOT EXISTS public.kyc_details (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    pan_number VARCHAR(20),
    gst_number VARCHAR(20),
    address TEXT,
    city TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code VARCHAR(20),
    pan_url TEXT,
    aadhar_url TEXT,
    cancelled_cheque_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    verified_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Pending' -- 'Pending', 'Under Review', 'Approved', 'Rejected'
);

-- 4. RLS for Notifications Log
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notification logs" 
ON public.notifications_log FOR SELECT 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Users can view their own notification logs" 
ON public.notifications_log FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 5. RLS for KYC Details
ALTER TABLE public.kyc_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own KYC" 
ON public.kyc_details FOR ALL 
TO authenticated 
USING (id = auth.uid());

CREATE POLICY "Admins can manage all KYC" 
ON public.kyc_details FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 6. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_log_user_id ON public.notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_details_status ON public.kyc_details(status);

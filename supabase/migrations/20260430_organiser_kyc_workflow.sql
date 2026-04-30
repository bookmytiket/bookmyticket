-- Migration: Enhanced Organiser Onboarding Workflow
-- Created: 2026-04-30

-- 1. Ensure kyc_status enum-like behavior for organisers
-- Check if organisers table exists and has the columns
DO $$ 
BEGIN
    -- Ensure status columns in partner_requests
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='partner_requests' AND column_name='kyc_status') THEN
        ALTER TABLE public.partner_requests ADD COLUMN kyc_status TEXT DEFAULT 'Pending';
    END IF;

    -- Ensure organiser table has the right columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='organisers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organisers' AND column_name='kyc_status') THEN
            ALTER TABLE public.organisers ADD COLUMN kyc_status TEXT DEFAULT 'Pending';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organisers' AND column_name='is_approved') THEN
            ALTER TABLE public.organisers ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organisers' AND column_name='rejection_reason') THEN
            ALTER TABLE public.organisers ADD COLUMN rejection_reason TEXT;
        END IF;
    END IF;
END $$;

-- 2. Ensure kyc_details table is robust
CREATE TABLE IF NOT EXISTS public.kyc_details (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_name TEXT,
    contact_person TEXT,
    id_proof_url TEXT, -- Aadhar / PAN
    business_proof_url TEXT, -- Registration
    address_proof_url TEXT,
    bank_details JSONB, -- {bank_name, account_number, ifsc_code}
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Submitted', 'Approved', 'Rejected'
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS for kyc_details (allow organisers to manage their own, admins to manage all)
ALTER TABLE public.kyc_details ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Organisers can manage their own KYC" ON public.kyc_details;
    CREATE POLICY "Organisers can manage their own KYC" 
    ON public.kyc_details FOR ALL 
    TO authenticated 
    USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Admins can view all KYC" ON public.kyc_details;
    CREATE POLICY "Admins can view all KYC" 
    ON public.kyc_details FOR SELECT 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
    
    DROP POLICY IF EXISTS "Admins can update all KYC" ON public.kyc_details;
    CREATE POLICY "Admins can update all KYC" 
    ON public.kyc_details FOR UPDATE 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
END $$;

-- ============================================================
-- BookMyTicket — WITHDRAWAL WORKFLOW INFRASTRUCTURE
-- ============================================================

-- 1. Organiser Bank Details Table
CREATE TABLE IF NOT EXISTS public.organiser_bank_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organiser_id UUID REFERENCES public.organisers(id) ON DELETE CASCADE,
    account_holder_name TEXT NOT NULL,
    bank_name TEXT,
    account_number TEXT NOT NULL,
    ifsc_code TEXT,
    upi_id TEXT,
    payment_type TEXT DEFAULT 'bank', -- 'bank' or 'upi'
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Update Withdraw Requests table if missing columns
-- We'll add nullable columns to existing table for compatibility
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdraw_requests' AND column_name='bank_details_id') THEN
        ALTER TABLE public.withdraw_requests ADD COLUMN bank_details_id UUID REFERENCES public.organiser_bank_details(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdraw_requests' AND column_name='payment_method') THEN
        ALTER TABLE public.withdraw_requests ADD COLUMN payment_method TEXT DEFAULT 'bank';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdraw_requests' AND column_name='rejection_reason') THEN
        ALTER TABLE public.withdraw_requests ADD COLUMN rejection_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdraw_requests' AND column_name='approved_at') THEN
        ALTER TABLE public.withdraw_requests ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='withdraw_requests' AND column_name='paid_at') THEN
        ALTER TABLE public.withdraw_requests ADD COLUMN paid_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Admin Activity Logs
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    module_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_id UUID,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS POLICIES

-- Bank Details
ALTER TABLE public.organiser_bank_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers manage own bank details" ON public.organiser_bank_details;
CREATE POLICY "Organisers manage own bank details" ON public.organiser_bank_details
    FOR ALL USING (auth.uid() = organiser_id);

DROP POLICY IF EXISTS "Admins view all bank details" ON public.organiser_bank_details;
CREATE POLICY "Admins view all bank details" ON public.organiser_bank_details
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'finance_admin')));

-- Admin Logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage logs" ON public.admin_activity_logs;
CREATE POLICY "Admins manage logs" ON public.admin_activity_logs
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

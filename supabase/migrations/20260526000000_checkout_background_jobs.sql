-- Migration: 20260526_checkout_background_jobs.sql
-- Redevelops the real-time payment confirmation and ticket issuance workflow.

-- 1. Ensure new columns are added to the bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_ref TEXT;

-- 2. Ensure new columns are added to the tickets table
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS ticket_code TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qr_token TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP WITH TIME ZONE;

-- 3. Ensure new columns are added to the payment_transactions table
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS booking_session_id UUID REFERENCES public.booking_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.payment_transactions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- 4. Create the background_jobs table for deferred processing
CREATE TABLE IF NOT EXISTS public.background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL, -- 'settlement', 'rewards', 'notifications'
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    attempts INTEGER DEFAULT 0,
    payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Enable Row Level Security on background_jobs
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for background_jobs
DROP POLICY IF EXISTS "Service role full access background_jobs" ON public.background_jobs;
DROP POLICY IF EXISTS "Service role full access background_jobs" ON public.background_jobs;
CREATE POLICY "Service role full access background_jobs" ON public.background_jobs
    FOR ALL USING (auth.role() = 'service_role');

-- 7. Notify pgrst to reload the schema cache
NOTIFY pgrst, 'reload schema';

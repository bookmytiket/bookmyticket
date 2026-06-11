-- 20260611000000_email_communication_workflow.sql
-- Implements robust email notification workflow infrastructure.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Email Logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add missing columns in case the table already existed with a different schema
DO $$ 
BEGIN
    -- recipient_email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='recipient_email') THEN
        ALTER TABLE public.email_logs ADD COLUMN recipient_email VARCHAR(255);
    END IF;

    -- subject
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='subject') THEN
        ALTER TABLE public.email_logs ADD COLUMN subject VARCHAR(255);
    END IF;

    -- error_message
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='error_message') THEN
        ALTER TABLE public.email_logs ADD COLUMN error_message TEXT;
    END IF;

    -- sent_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='sent_at') THEN
        ALTER TABLE public.email_logs ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- event_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='event_id') THEN
        ALTER TABLE public.email_logs ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
    END IF;
    
    -- booking_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='booking_id') THEN
        ALTER TABLE public.email_logs ADD COLUMN booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;
    END IF;
    
    -- email_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='email_type') THEN
        ALTER TABLE public.email_logs ADD COLUMN email_type VARCHAR(50) DEFAULT 'GENERIC';
    END IF;

    -- delivery_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='delivery_status') THEN
        ALTER TABLE public.email_logs ADD COLUMN delivery_status VARCHAR(50) DEFAULT 'pending';
    END IF;

    -- provider
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='provider') THEN
        ALTER TABLE public.email_logs ADD COLUMN provider VARCHAR(50);
    END IF;

    -- provider_message_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='provider_message_id') THEN
        ALTER TABLE public.email_logs ADD COLUMN provider_message_id VARCHAR(255);
    END IF;

    -- retry_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_logs' AND column_name='retry_count') THEN
        ALTER TABLE public.email_logs ADD COLUMN retry_count INT DEFAULT 0;
    END IF;
END $$;

-- Add tracking columns to existing tables
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ticket_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invoice_email_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_email_sent BOOLEAN DEFAULT FALSE;

-- Create Index for email queries
CREATE INDEX IF NOT EXISTS idx_email_logs_booking_id ON public.email_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(delivery_status);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Safely drop existing policies to recreate them if needed
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can view all email logs" ON public.email_logs;
    DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_logs;
    DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;
    DROP POLICY IF EXISTS "Service role can update email logs" ON public.email_logs;
END $$;

-- Policies for email logs
CREATE POLICY "Admins can view all email logs" ON public.email_logs
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users can view their own email logs" ON public.email_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Service role can insert email logs" ON public.email_logs
    FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role can update email logs" ON public.email_logs
    FOR UPDATE TO service_role
    USING (true)
    WITH CHECK (true);

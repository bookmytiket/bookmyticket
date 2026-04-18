-- Add phone support to profiles if not already present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- WhatsApp Logs for tracking and debugging
CREATE TABLE IF NOT EXISTS public."whatsappLogs" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT, -- 'SUCCESS', 'FAILED'
    response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."whatsappLogs" ENABLE ROW LEVEL SECURITY;

-- Admins can view logs
CREATE POLICY "Admins view whatsapp logs"
ON public."whatsappLogs"
FOR SELECT
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- System can insert logs
CREATE POLICY "System insert whatsapp logs"
ON public."whatsappLogs"
FOR INSERT
WITH CHECK (true);

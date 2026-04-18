-- Communication Settings table for API keys and toggles
CREATE TABLE IF NOT EXISTS public."communicationSettings" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB DEFAULT '{}',
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMS Logs for tracking and debugging
CREATE TABLE IF NOT EXISTS public."smsLogs" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT, -- 'OTP', 'BOOKING', 'CANCELLATION', 'PROMOTION'
    status TEXT, -- 'SUCCESS', 'FAILED'
    response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."communicationSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."smsLogs" ENABLE ROW LEVEL SECURITY;

-- Only Admins can manage communication settings
CREATE POLICY "Admins manage comm settings"
ON public."communicationSettings"
FOR ALL
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Admins can view logs, system can insert
CREATE POLICY "Admins view logs"
ON public."smsLogs"
FOR SELECT
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Internal system trigger (allowing insert via service role or admin)
CREATE POLICY "Internal insert logs"
ON public."smsLogs"
FOR INSERT
WITH CHECK (true); 

-- Pre-populate default settings
INSERT INTO public."communicationSettings" (key, value, description)
VALUES 
('fast2sms', '{"apiKey": "", "senderId": "FSTSMS", "enabled": false}', 'Fast2SMS Configuration'),
('whatsapp', '{"apiKey": "", "provider": "meta", "senderNumber": "", "enabled": false}', 'WhatsApp API Configuration'),
('otp_settings', '{"enabled": false, "expirySeconds": 300}', 'OTP Workflow Toggle')
ON CONFLICT (key) DO NOTHING;

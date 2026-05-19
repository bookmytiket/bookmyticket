-- Create email_logs table with schema matching existing API expectations
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT,
    status TEXT DEFAULT 'PENDING', -- 'SUCCESS', 'FAILED', 'PENDING'
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view logs
CREATE POLICY "Admins can view email logs"
ON public.email_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- System can insert logs
CREATE POLICY "System can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- Ensure email_templates has category and unique identifier
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_templates' AND column_name = 'category') THEN
        ALTER TABLE public.email_templates ADD COLUMN category TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_templates_identifier_key') THEN
        ALTER TABLE public.email_templates ADD CONSTRAINT email_templates_identifier_key UNIQUE (identifier);
    END IF;
END $$;

-- Seed default templates
INSERT INTO public.email_templates (identifier, name, subject, body, category, auto_send)
VALUES 
('welcome_registration', 'Welcome Email', 'Welcome to BookMyTicket, {{name}}! 🎉', '<h1>Welcome to BookMyTicket!</h1><p>Hi {{name}},</p><p>Your account has been successfully created. Start exploring events and book your tickets now!</p><p><a href="{{site_url}}">Visit Website</a></p>', 'Welcome', true),
('password_reset', 'Password Reset', 'Reset Your BookMyTicket Password', '<h2>Password Reset Request</h2><p>Hi {{name}},</p><p>Click the button below to set a new password:</p><a href="{{reset_link}}" style="display: inline-block; padding: 12px 24px; background-color: #ec4899; color: white; text-decoration: none; border-radius: 8px;">Reset Password</a><p>If you did not request this, ignore this email.</p>', 'Password Reset', true),
('booking', 'Booking Confirmation', 'Booking Confirmed: {{eventName}}', '<h2>Booking Confirmed!</h2><p>Hi {{name}},</p><p>Your booking for <strong>{{eventName}}</strong> is confirmed.</p><p><strong>Date:</strong> {{date}}<br><strong>Booking ID:</strong> {{bookingId}}</p><p>Enjoy your event!</p>', 'Notification', true),
('otp', 'OTP Verification', '{{otp}} is your BookMyTicket OTP', '<h2>Verification Code</h2><p>Your OTP for BookMyTicket is: <strong>{{otp}}</strong></p><p>This code is valid for 5 minutes.</p>', 'Notification', true)
ON CONFLICT (identifier) DO UPDATE 
SET name = EXCLUDED.name, 
    subject = EXCLUDED.subject, 
    body = EXCLUDED.body, 
    category = EXCLUDED.category;

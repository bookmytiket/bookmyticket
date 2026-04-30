-- Setup for Contact Inquiry OTP Verification
CREATE TABLE IF NOT EXISTS contact_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    phone TEXT,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_contact_otps_email ON contact_otps(email);
CREATE INDEX IF NOT EXISTS idx_contact_otps_phone ON contact_otps(phone);

-- RLS
ALTER TABLE contact_otps ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage
CREATE POLICY "Allow admins to manage contact otps" 
ON public.contact_otps FOR ALL
USING (public.is_admin(auth.uid()));

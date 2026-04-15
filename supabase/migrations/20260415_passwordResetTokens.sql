-- Create passwordResetTokens table
CREATE TABLE IF NOT EXISTS public."passwordResetTokens" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add basic security
ALTER TABLE public."passwordResetTokens" ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service Role Full Access" 
ON public."passwordResetTokens"
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

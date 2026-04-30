-- Create contact_inquiries table
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    query_type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, in_progress, resolved
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public contact form)
CREATE POLICY "Allow public to insert inquiries" 
ON public.contact_inquiries FOR INSERT 
WITH CHECK (true);

-- Allow admins to view and manage
CREATE POLICY "Allow admins to manage inquiries" 
ON public.contact_inquiries FOR ALL
USING (public.is_admin(auth.uid()));

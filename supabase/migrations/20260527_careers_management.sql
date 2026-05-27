-- Migration: Careers Management System
-- Description: Creates tables for jobs and job applications, sets up RLS policies, and creates a storage bucket for resumes.

CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    responsibilities TEXT,
    qualifications TEXT,
    preferred_skills TEXT,
    skills TEXT[] DEFAULT '{}',
    openings INTEGER DEFAULT 1,
    salary_range TEXT,
    deadline DATE,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    cover_letter TEXT,
    portfolio_url TEXT,
    resume_url TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on jobs"
ON public.jobs FOR SELECT
USING (status = 'open' OR auth.role() = 'service_role');

CREATE POLICY "Enable all access for admin on jobs"
ON public.jobs FOR ALL
USING (auth.role() = 'service_role');

-- RLS Policies for job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for all users on applications"
ON public.job_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable read access for admin on applications"
ON public.job_applications FOR SELECT
USING (auth.role() = 'service_role');

CREATE POLICY "Enable update for admin on applications"
ON public.job_applications FOR UPDATE
USING (auth.role() = 'service_role');

-- Storage Bucket for Careers (Resumes)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('careers', 'careers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Careers Bucket
CREATE POLICY "Public Access for careers bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'careers');

CREATE POLICY "Enable upload for anyone"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'careers');

-- Add to publications for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE job_applications;

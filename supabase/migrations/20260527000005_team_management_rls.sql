-- Migration: Admins RLS
-- Description: Grant admins access to view and manage the admins table

-- Disable RLS temporarily to clean up any conflicting policies
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can update admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
CREATE POLICY "Admins can view admins" ON public.admins FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Admins can insert admins" ON public.admins;
CREATE POLICY "Admins can insert admins" ON public.admins FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Admins can update admins" ON public.admins;
CREATE POLICY "Admins can update admins" ON public.admins FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;
CREATE POLICY "Admins can delete admins" ON public.admins FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin') OR auth.role() = 'service_role'
);

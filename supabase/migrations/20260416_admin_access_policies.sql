-- Add Administrative Access Policies for consolidated tables

-- 1. Vendors table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins have full access to vendors" ON public.vendors;
    CREATE POLICY "Admins have full access to vendors" ON public.vendors 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
END $$;

-- 2. Public Users table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins have full access to public_users" ON public.public_users;
    CREATE POLICY "Admins have full access to public_users" ON public.public_users 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
    
    DROP POLICY IF EXISTS "Users can view own record" ON public.public_users;
    CREATE POLICY "Users can view own record" ON public.public_users FOR SELECT USING (auth.uid() = id);
END $$;

-- 3. Staff table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins have full access to staff" ON public.staff;
    CREATE POLICY "Admins have full access to staff" ON public.staff 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
    
    DROP POLICY IF EXISTS "Staff can view own record" ON public.staff;
    CREATE POLICY "Staff can view own record" ON public.staff FOR SELECT USING (auth.uid() = id);
END $$;

-- 4. Branding Partners table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins have full access to branding_partners" ON public.branding_partners;
    CREATE POLICY "Admins have full access to branding_partners" ON public.branding_partners 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
    
    DROP POLICY IF EXISTS "Partners can view own record" ON public.branding_partners;
    CREATE POLICY "Partners can view own record" ON public.branding_partners FOR SELECT USING (auth.uid() = id);
END $$;

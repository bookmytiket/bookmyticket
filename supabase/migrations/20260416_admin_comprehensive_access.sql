-- Comprehensive Administrative Access Policies

-- 1. Vendors
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins have full access to vendors" ON public.vendors;
    CREATE POLICY "Admins have full access to vendors" ON public.vendors 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
END $$;

-- 2. Partner Requests
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins have full access to partner_requests" ON public.partner_requests;
    CREATE POLICY "Admins have full access to partner_requests" ON public.partner_requests 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
    
    -- Also allow visitors to INSERT (for the landing page form)
    DROP POLICY IF EXISTS "Visitors can submit partner requests" ON public.partner_requests;
    CREATE POLICY "Visitors can submit partner requests" ON public.partner_requests FOR INSERT WITH CHECK (true);
END $$;

-- 3. Staff
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins have full access to staff" ON public.staff;
    CREATE POLICY "Admins have full access to staff" ON public.staff 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
END $$;

-- 4. Branding Partners
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins have full access to branding_partners" ON public.branding_partners;
    CREATE POLICY "Admins have full access to branding_partners" ON public.branding_partners 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
END $$;

-- 5. Public Users
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins have full access to public_users" ON public.public_users;
    CREATE POLICY "Admins have full access to public_users" ON public.public_users 
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
END $$;

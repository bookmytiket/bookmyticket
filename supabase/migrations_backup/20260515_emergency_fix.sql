-- ============================================================
-- BookMyTicket — EMERGENCY RLS RECURSION CLEAN-UP
-- ============================================================

-- 1. FORCE DROP ALL POLICIES ON PROFILES (The "Nuclear" Option)
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. RESET FUNCTIONS
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_platform_admin() CASCADE;

-- 3. RE-CREATE RECURSION-SAFE REGISTRY
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RE-CREATE THE SAFE HELPER (Uses registry, NOT profiles)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- We use a simple count/exists on the registry table
  -- This NEVER queries the profiles table, so NO RECURSION is possible.
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. POPULATE REGISTRY
-- We do a one-time bypass check to get existing admins
INSERT INTO public.platform_admins (id)
SELECT id FROM public.profiles 
WHERE role IN ('admin', 'super_admin', 'system_admin')
ON CONFLICT (id) DO NOTHING;

-- 6. RE-APPLY CLEAN POLICIES
-- A. Owner Access (Direct ID check is always recursion-safe)
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- B. Admin Access (Uses the safe registry helper)
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (public.is_platform_admin());

-- 7. SET UP AUTO-SYNC (Ensures registry stays up to date)
CREATE OR REPLACE FUNCTION public.sync_platform_admins()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.role IN ('admin', 'super_admin', 'system_admin')) THEN
        INSERT INTO public.platform_admins (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
    ELSE
        DELETE FROM public.platform_admins WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_platform_admins();

-- Final Verification: Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BookMyTicket — Recursion-Safe Admin Registry
-- ============================================================

-- 1. Create Admin Registry to break RLS recursion
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Populate registry from existing profiles
INSERT INTO public.platform_admins (id)
SELECT id FROM public.profiles 
WHERE role IN ('admin', 'super_admin', 'system_admin')
ON CONFLICT (id) DO NOTHING;

-- 3. Create Trigger to keep registry in sync
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

-- 4. Update the helper function to be recursion-safe
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Refresh Admin Override Policies
-- We'll just ensure the helper is used everywhere as it's now safe.
-- Note: Profiles table now uses this safe helper.
DROP POLICY IF EXISTS "Admin global access profiles" ON public.profiles;
CREATE POLICY "Admin global access profiles" ON public.profiles 
FOR ALL TO authenticated USING (public.is_platform_admin());

-- Re-apply to all other tables (idempotent)
DO $$ 
BEGIN
    -- No changes needed to other policies as they already call is_platform_admin()
    -- which is now recursion-safe.
END $$;

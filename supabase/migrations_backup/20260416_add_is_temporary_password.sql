-- Add is_temporary_password column to organisers and vendors tables
ALTER TABLE public.organisers ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT FALSE;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT FALSE;

-- Ensure profiles also has it (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN public.organisers.is_temporary_password IS 'Flag to force password change on first login for newly created organiser accounts.';
COMMENT ON COLUMN public.vendors.is_temporary_password IS 'Flag to force password change on first login for newly created vendor accounts.';
COMMENT ON COLUMN public.profiles.is_temporary_password IS 'Flag to force password change on first login for newly created partner accounts.';

-- Sync function to keep force_password_change and is_temporary_password in sync
CREATE OR REPLACE FUNCTION public.sync_password_flags()
RETURNS TRIGGER AS $$
BEGIN
    -- If is_temporary_password was updated, sync force_password_change
    IF (NEW.is_temporary_password IS DISTINCT FROM OLD.is_temporary_password) THEN
        NEW.force_password_change := NEW.is_temporary_password;
    -- If force_password_change was updated, sync is_temporary_password
    ELSIF (NEW.force_password_change IS DISTINCT FROM OLD.force_password_change) THEN
        NEW.is_temporary_password := NEW.force_password_change;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply sync trigger to profiles
DROP TRIGGER IF EXISTS tr_sync_password_flags_profiles ON public.profiles;
CREATE TRIGGER tr_sync_password_flags_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_password_flags();

-- Apply sync trigger to organisers
DROP TRIGGER IF EXISTS tr_sync_password_flags_organisers ON public.organisers;
CREATE TRIGGER tr_sync_password_flags_organisers
    BEFORE UPDATE ON public.organisers
    FOR EACH ROW EXECUTE FUNCTION public.sync_password_flags();

-- Vendors don't have force_password_change column yet in schema, let's add it for consistency or just sync to profiles
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;
DROP TRIGGER IF EXISTS tr_sync_password_flags_vendors ON public.vendors;
CREATE TRIGGER tr_sync_password_flags_vendors
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW EXECUTE FUNCTION public.sync_password_flags();

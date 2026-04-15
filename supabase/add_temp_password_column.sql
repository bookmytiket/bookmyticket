-- Add is_temporary_password column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_temporary_password BOOLEAN DEFAULT FALSE;

-- Ensure RLS is enabled and policies allow reading this column (standard RLS usually covers all columns)
COMMENT ON COLUMN public.profiles.is_temporary_password IS 'Flag to force password change on first login for newly created partner accounts.';

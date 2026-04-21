-- Migration: Fix RLS policies for branding storage bucket
-- Description: Allows authenticated admins to upload, update, and delete assets in the 'branding' bucket.

-- 1. Ensure the branding bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'branding', 
    'branding', 
    true, 
    5242880, -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, 
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/svg+xml'];

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies for the branding bucket to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Branding Assets Management" ON storage.objects;

-- 4. Policy to allow public read access to branding assets
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'branding' );

-- 5. Policy to allow authenticated admins to manage branding assets
-- This allows INSERT, UPDATE, SELECT, and DELETE for users with 'admin' or 'super_admin' roles.
-- Note: 'upsert' operations require INSERT, UPDATE, and SELECT permissions.
CREATE POLICY "Admin Branding Assets Management"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'branding' 
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'admin' OR role = 'super_admin')
        )
    )
)
WITH CHECK (
    bucket_id = 'branding' 
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'admin' OR role = 'super_admin')
        )
    )
);

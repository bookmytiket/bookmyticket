-- Migration: Create memories storage bucket
-- Description: Creates a public storage bucket for 'memories' assets and sets up RLS for admin access.

-- 1. Ensure the memories bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'memories', 
    'memories', 
    true, 
    5242880, -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, 
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

-- 2. Policy to allow public read access to memories assets
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access Memories"
ON storage.objects FOR SELECT
USING ( bucket_id = 'memories' );

-- 3. Policy to allow authenticated admins to manage memories assets
DROP POLICY IF EXISTS "Admin Memories Management" ON storage.objects;
CREATE POLICY "Admin Memories Management"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'memories' 
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'admin' OR role = 'super_admin')
        )
    )
)
WITH CHECK (
    bucket_id = 'memories' 
    AND (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND (role = 'admin' OR role = 'super_admin')
        )
    )
);

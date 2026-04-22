-- Migration: Enhance vendor_reviews with image support and set up storage
-- Description: Adds image_url to vendor_reviews and creates storage bucket for review images.

-- 1. Add image_url column to vendor_reviews
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vendor_reviews' AND column_name = 'image_url') THEN
        ALTER TABLE public.vendor_reviews ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 2. Ensure the 'review-images' bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'review-images', 
    'review-images', 
    true, 
    5242880, -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, 
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/heic'];

-- 3. Policy to allow public read access to review images
DROP POLICY IF EXISTS "Public Read Review Images" ON storage.objects;
CREATE POLICY "Public Read Review Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'review-images' );

-- 4. Policy to allow authenticated users to upload review images
-- Users can only upload to a path that includes their own user ID
DROP POLICY IF EXISTS "Authenticated User Upload Review Images" ON storage.objects;
CREATE POLICY "Authenticated User Upload Review Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'review-images' 
    AND (auth.uid()::text = (storage.foldername(name))[1])
);

-- 5. Policy to allow users to delete their own review images
DROP POLICY IF EXISTS "Users can delete own review images" ON storage.objects;
CREATE POLICY "Users can delete own review images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'review-images' 
    AND (auth.uid()::text = (storage.foldername(name))[1])
);

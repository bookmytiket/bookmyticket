-- ENSURE STORAGE BUCKET EXISTS
INSERT INTO storage.buckets (id, name, public)
SELECT 'event-images', 'event-images', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'event-images'
);

-- RLS POLICIES FOR 'event-images' BUCKET

-- 1. Allow public viewing of images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access for Event Images'
    ) THEN
        CREATE POLICY "Public Access for Event Images"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'event-images');
    END IF;
END $$;

-- 2. Allow authenticated organisers to upload images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Organisers Upload'
    ) THEN
        CREATE POLICY "Authenticated Organisers Upload"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'event-images');
    END IF;
END $$;

-- 3. Allow organisers to update/delete their own images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Organisers Manage Own Images'
    ) THEN
        CREATE POLICY "Organisers Manage Own Images"
        ON storage.objects FOR ALL
        TO authenticated
        USING (bucket_id = 'event-images' AND auth.uid() = owner);
    END IF;
END $$;

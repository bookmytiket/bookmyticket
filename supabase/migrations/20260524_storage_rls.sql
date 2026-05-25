-- RLS is already enabled by default on storage.objects in Supabase.
-- We just need to add the policies for our new buckets.

-- Allow authenticated users to upload files to all new buckets
CREATE POLICY "Allow authenticated uploads to new buckets" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id IN ('organizer-kyc-documents', 'organizer-profile-assets', 'bank-documents') );

-- Allow users to read their own files (or all files in the bucket, depending on need)
CREATE POLICY "Allow authenticated reads from new buckets" 
ON storage.objects FOR SELECT 
TO authenticated 
USING ( bucket_id IN ('organizer-kyc-documents', 'organizer-profile-assets', 'bank-documents') );

-- Allow users to update their own files (in case of re-upload with same name)
CREATE POLICY "Allow authenticated updates to new buckets" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id IN ('organizer-kyc-documents', 'organizer-profile-assets', 'bank-documents') );

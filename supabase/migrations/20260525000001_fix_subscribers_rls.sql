-- Enable RLS on the subscribers table (if not already enabled)
ALTER TABLE IF EXISTS public.subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow admins to view subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Allow admins to manage subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Allow authenticated to view subscribers" ON public.subscribers;

-- Create policy to allow authenticated users (like admins) to view subscribers
DROP POLICY IF EXISTS "Allow authenticated to view subscribers" ON public.subscribers;
CREATE POLICY "Allow authenticated to view subscribers" ON public.subscribers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users (like admins) to delete subscribers
DROP POLICY IF EXISTS "Allow authenticated to delete subscribers" ON public.subscribers;
CREATE POLICY "Allow authenticated to delete subscribers" ON public.subscribers
  FOR DELETE USING (auth.role() = 'authenticated');

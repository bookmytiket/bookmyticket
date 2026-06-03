-- Add Admin full access policy to events table
DROP POLICY IF EXISTS "Admin full access events" ON public.events;
DROP POLICY IF EXISTS "Admin full access events" ON public.events;
CREATE POLICY "Admin full access events" ON public.events FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

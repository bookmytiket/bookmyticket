-- Add Admin full access policy to events table
CREATE POLICY "Admin full access events" ON public.events FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

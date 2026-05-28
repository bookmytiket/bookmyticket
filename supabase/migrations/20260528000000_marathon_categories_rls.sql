-- Allow public read access to marathon_categories
CREATE POLICY "Allow public read access to marathon_categories" ON public.marathon_categories FOR SELECT USING (true);

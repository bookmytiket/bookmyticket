-- Allow public read access to marathon_categories
DROP POLICY IF EXISTS "Allow public read access to marathon_categories" ON public.marathon_categories;
CREATE POLICY "Allow public read access to marathon_categories" ON public.marathon_categories FOR SELECT USING (true);

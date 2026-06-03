ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.memories;
CREATE POLICY "Enable read access for all users" ON public.memories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.memories;
CREATE POLICY "Enable insert for authenticated users only" ON public.memories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.memories;
CREATE POLICY "Enable update for authenticated users only" ON public.memories FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.memories;
CREATE POLICY "Enable delete for authenticated users only" ON public.memories FOR DELETE USING (auth.role() = 'authenticated');

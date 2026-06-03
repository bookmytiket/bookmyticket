ALTER TABLE public.organisers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers can view their own record" ON public.organisers;
DROP POLICY IF EXISTS "Organisers can view their own record" ON public.organisers;
CREATE POLICY "Organisers can view their own record" ON public.organisers FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Organisers can update their own record" ON public.organisers;
DROP POLICY IF EXISTS "Organisers can update their own record" ON public.organisers;
CREATE POLICY "Organisers can update their own record" ON public.organisers FOR UPDATE USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.marathon_sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marathon_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    sponsor_name TEXT NOT NULL,
    logo_url TEXT,
    sponsor_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marathon_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marathon_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    benefit_name TEXT NOT NULL,
    icon_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marathon_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marathon_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view marathon sponsors" ON public.marathon_sponsors FOR SELECT USING (true);
CREATE POLICY "Public can view marathon benefits" ON public.marathon_benefits FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_marathon_sponsors_marathon_id ON public.marathon_sponsors(marathon_id);
CREATE INDEX IF NOT EXISTS idx_marathon_benefits_marathon_id ON public.marathon_benefits(marathon_id);

GRANT ALL ON TABLE public.marathon_sponsors TO authenticated, anon, service_role;
GRANT ALL ON TABLE public.marathon_benefits TO authenticated, anon, service_role;

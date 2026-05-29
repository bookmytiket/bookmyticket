-- Table: ifsc_codes
CREATE TABLE IF NOT EXISTS public.ifsc_codes (
    ifsc VARCHAR(11) PRIMARY KEY,
    bank VARCHAR(255) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    address TEXT,
    contact VARCHAR(100),
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.ifsc_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for ifsc" ON public.ifsc_codes FOR SELECT USING (true);
CREATE POLICY "Service role full access ifsc" ON public.ifsc_codes FOR ALL USING (true);

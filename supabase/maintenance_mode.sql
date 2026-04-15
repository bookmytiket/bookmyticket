-- 11. MAINTENANCE CONFIGURATION (Idempotent Script)
--------------------------------------------------------------------------------

-- Create Table
CREATE TABLE IF NOT EXISTS public."systemConfig" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_message TEXT DEFAULT 'We’re upgrading your experience. Please check back soon!',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."systemConfig" ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read maintenance status.' AND tablename = 'systemConfig') THEN
        CREATE POLICY "Public can read maintenance status." ON public."systemConfig" FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access to systemConfig.' AND tablename = 'systemConfig') THEN
        CREATE POLICY "Admins have full access to systemConfig." ON public."systemConfig" FOR ALL USING (
          (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
          EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
        );
    END IF;
END $$;

-- Initial Seed (if empty)
INSERT INTO public."systemConfig" (maintenance_mode, maintenance_message)
SELECT false, 'We’re upgrading your experience. Please check back soon!'
WHERE NOT EXISTS (SELECT 1 FROM public."systemConfig");

-- Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'systemConfig'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "systemConfig";
    END IF;
END $$;

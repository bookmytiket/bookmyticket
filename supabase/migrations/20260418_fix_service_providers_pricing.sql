-- Add pricing column to service_providers
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '[]';

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Add policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Service providers can view own profile" ON public.service_providers;
    CREATE POLICY "Service providers can view own profile" ON public.service_providers 
    FOR SELECT USING (auth.uid() = organiser_id OR auth.uid() = id);

    DROP POLICY IF EXISTS "Service providers can update own profile" ON public.service_providers;
    CREATE POLICY "Service providers can update own profile" ON public.service_providers 
    FOR UPDATE USING (auth.uid() = organiser_id OR auth.uid() = id);
END $$;

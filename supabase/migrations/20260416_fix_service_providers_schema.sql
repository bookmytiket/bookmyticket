-- UNIFY Service Providers Table with Frontend Requirements
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS organiser_id UUID REFERENCES public.profiles(id) UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS advanced_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create a trigger to sync updated_at
CREATE OR REPLACE FUNCTION update_sp_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_providers_modtime
BEFORE UPDATE ON public.service_providers
FOR EACH ROW EXECUTE FUNCTION update_sp_updated_at_column();

-- Backfill organiser_id if it's missing (using id)
UPDATE public.service_providers SET organiser_id = id WHERE organiser_id IS NULL;

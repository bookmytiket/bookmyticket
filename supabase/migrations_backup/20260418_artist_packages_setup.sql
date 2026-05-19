-- Create the artistPackages table as requested
CREATE TABLE IF NOT EXISTS public."artistPackages" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    duration TEXT,
    description TEXT,
    features TEXT[] DEFAULT '{}',
    type TEXT DEFAULT 'standard', -- 'standard' or 'custom'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."artistPackages" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Vendors can manage their own packages"
ON public."artistPackages"
FOR ALL
USING (auth.uid() = vendor_id);

CREATE POLICY "Public can view artist packages"
ON public."artistPackages"
FOR SELECT
USING (true);

-- Fix vendors RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can manage their own vendor record"
ON public.vendors
FOR ALL
USING (auth.uid() = id);

CREATE POLICY "Public can view vendors"
ON public.vendors
FOR SELECT
USING (true);

-- Also fix service_providers RLS
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can insert their own service_provider record" ON public.service_providers;
    DROP POLICY IF EXISTS "Users can select their own service_provider record" ON public.service_providers;
    DROP POLICY IF EXISTS "Users can update their own service_provider record" ON public.service_providers;
END $$;

CREATE POLICY "Users can manage their own service_provider record"
ON public.service_providers
FOR ALL
USING (auth.uid() = id OR auth.uid() = organiser_id);

CREATE POLICY "Public can view service_providers"
ON public.service_providers
FOR SELECT
USING (true);

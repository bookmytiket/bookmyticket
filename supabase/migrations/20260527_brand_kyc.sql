-- Create brand_kyc table for storing brand verification and KYC details
CREATE TABLE IF NOT EXISTS public.brand_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    registration_number TEXT,
    tax_id TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'pending',
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(brand_id)
);

-- RLS Policies
ALTER TABLE public.brand_kyc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view their own KYC"
    ON public.brand_kyc
    FOR SELECT
    USING (auth.uid() = brand_id);

CREATE POLICY "Brands can insert their own KYC"
    ON public.brand_kyc
    FOR INSERT
    WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "Brands can update their own KYC"
    ON public.brand_kyc
    FOR UPDATE
    USING (auth.uid() = brand_id);

CREATE POLICY "Admins can view all KYC"
    ON public.brand_kyc
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admins WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can update all KYC"
    ON public.brand_kyc
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admins WHERE id = auth.uid()
        )
    );

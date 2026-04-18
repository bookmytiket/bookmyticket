-- 1. Create New Tables for Role-Specific Data

-- VENDORS (Professional Services)
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    category TEXT,
    type TEXT DEFAULT 'professional_service',
    description TEXT,
    kyc_status TEXT DEFAULT 'Pending',
    is_approved BOOLEAN DEFAULT false,
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
    kyc_details JSONB,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORGANISERS
CREATE TABLE IF NOT EXISTS public.organisers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    type TEXT DEFAULT 'event_organiser',
    kyc_status TEXT DEFAULT 'Pending',
    is_approved BOOLEAN DEFAULT false,
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
    kyc_details JSONB,
    force_password_change BOOLEAN DEFAULT false,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STAFF
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    organiser_id UUID REFERENCES public.organisers(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'Staff',
    permissions JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PUBLIC USERS
CREATE TABLE IF NOT EXISTS public.public_users (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    loyalty_points INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BRANDING PARTNERS
CREATE TABLE IF NOT EXISTS public.branding_partners (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_name TEXT,
    website_url TEXT,
    kyc_status TEXT DEFAULT 'Pending',
    is_approved BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Data Migration from organiser_details

-- Migrate Event Organisers
INSERT INTO public.organisers (id, business_name, type, kyc_status, is_approved, wallet_balance, kyc_details, force_password_change, lat, lng, updated_at)
SELECT id, business_name, type, kyc_status, is_approved, wallet_balance, kyc_details, force_password_change, lat, lng, updated_at
FROM public.organiser_details
WHERE type = 'event_organiser'
ON CONFLICT (id) DO NOTHING;

-- Migrate Vendors (Professional Services)
INSERT INTO public.vendors (id, business_name, category, type, kyc_status, is_approved, wallet_balance, kyc_details, lat, lng, updated_at)
SELECT id, business_name, category, type, kyc_status, is_approved, wallet_balance, kyc_details, lat, lng, updated_at
FROM public.organiser_details
WHERE type = 'professional_service'
ON CONFLICT (id) DO NOTHING;

-- 3. Data Migration from profiles for other roles
INSERT INTO public.staff (id, role, updated_at)
SELECT id, 'Staff', updated_at FROM public.profiles WHERE role = 'staff' ON CONFLICT (id) DO NOTHING;

INSERT INTO public.public_users (id, updated_at)
SELECT id, updated_at FROM public.profiles WHERE role = 'user' ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS for all new tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_partners ENABLE ROW LEVEL SECURITY;

-- 5. Baseline Policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Vendors can view own record" ON public.vendors;
    CREATE POLICY "Vendors can view own record" ON public.vendors FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Vendors can update own record" ON public.vendors FOR UPDATE USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Organisers can view own record" ON public.organisers;
    CREATE POLICY "Organisers can view own record" ON public.organisers FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Organisers can update own record" ON public.organisers FOR UPDATE USING (auth.uid() = id);
END $$;

-- 6. BACKWARD COMPATIBILITY: Rename old table and create a VIEW
-- WARNING: This part requires running as superuser or having correct permissions.
-- If you cannot rename, just comment out the ALTE TABLE and use the VIEW with a different name if needed.

ALTER TABLE public.organiser_details RENAME TO organiser_details_backup;

CREATE OR REPLACE VIEW public.organiser_details AS
SELECT id, business_name, category, type, description, kyc_status, is_approved, wallet_balance, kyc_details, NULL::BOOLEAN as force_password_change, lat, lng, updated_at FROM public.vendors
UNION ALL
SELECT id, business_name, NULL as category, type, NULL as description, kyc_status, is_approved, wallet_balance, kyc_details, force_password_change, lat, lng, updated_at FROM public.organisers;

-- 7. INSTEAD OF TRIGGER for mutations on the VIEW
CREATE OR REPLACE FUNCTION public.handle_organiser_details_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.type = 'professional_service') THEN
            INSERT INTO public.vendors (id, business_name, category, type, description, kyc_status, is_approved, wallet_balance, kyc_details, lat, lng, updated_at)
            VALUES (NEW.id, NEW.business_name, NEW.category, NEW.type, NEW.description, NEW.kyc_status, NEW.is_approved, NEW.wallet_balance, NEW.kyc_details, NEW.lat, NEW.lng, NOW());
        ELSE
            INSERT INTO public.organisers (id, business_name, type, kyc_status, is_approved, wallet_balance, kyc_details, force_password_change, lat, lng, updated_at)
            VALUES (NEW.id, NEW.business_name, NEW.type, NEW.kyc_status, NEW.is_approved, NEW.wallet_balance, NEW.kyc_details, COALESCE(NEW.force_password_change, false), NEW.lat, NEW.lng, NOW());
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.type = 'professional_service') THEN
            UPDATE public.vendors 
            SET business_name = NEW.business_name, 
                category = NEW.category, 
                kyc_status = NEW.kyc_status, 
                is_approved = NEW.is_approved,
                wallet_balance = NEW.wallet_balance,
                kyc_details = NEW.kyc_details,
                lat = NEW.lat,
                lng = NEW.lng,
                updated_at = NOW()
            WHERE id = OLD.id;
        ELSE
            UPDATE public.organisers 
            SET business_name = NEW.business_name, 
                kyc_status = NEW.kyc_status, 
                is_approved = NEW.is_approved,
                wallet_balance = NEW.wallet_balance,
                kyc_details = NEW.kyc_details,
                force_password_change = COALESCE(NEW.force_password_change, OLD.force_password_change),
                lat = NEW.lat,
                lng = NEW.lng,
                updated_at = NOW()
            WHERE id = OLD.id;
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM public.vendors WHERE id = OLD.id;
        DELETE FROM public.organisers WHERE id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organiser_details_mutation_trigger ON public.organiser_details;
CREATE TRIGGER organiser_details_mutation_trigger
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.organiser_details
FOR EACH ROW EXECUTE FUNCTION public.handle_organiser_details_mutation();


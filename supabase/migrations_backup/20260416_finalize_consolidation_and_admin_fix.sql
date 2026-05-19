-- 1. Restore Admin Access for hello@bookmyticket.net
-- Auth ID: e8f6c70c-5407-4cdb-a05f-825b476f21ea
INSERT INTO public.profiles (id, email, full_name, username, role, status)
VALUES ('e8f6c70c-5407-4cdb-a05f-825b476f21ea', 'hello@bookmyticket.net', 'System Admin', 'admin_hello', 'admin', 'Active')
ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'Active';

INSERT INTO public.admins (id, role)
VALUES ('e8f6c70c-5407-4cdb-a05f-825b476f21ea', 'Super Admin')
ON CONFLICT (id) DO NOTHING;

-- 2. Enhance Vendors table to support Organiser fields
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;

-- 3. Migrate Organisers to Vendors
-- We use COALESCE/EXCLUDED to avoid overwriting if they somehow exist in both (unlikely)
INSERT INTO public.vendors (id, business_name, type, kyc_status, is_approved, wallet_balance, kyc_details, force_password_change, lat, lng, updated_at)
SELECT id, business_name, type, kyc_status, is_approved, wallet_balance, kyc_details, force_password_change, lat, lng, updated_at
FROM public.organisers
ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    type = EXCLUDED.type,
    kyc_status = EXCLUDED.kyc_status,
    is_approved = EXCLUDED.is_approved,
    wallet_balance = EXCLUDED.wallet_balance,
    kyc_details = EXCLUDED.kyc_details,
    force_password_change = EXCLUDED.force_password_change,
    updated_at = NOW();

-- 4. Sync specific users to service_providers
-- Kalaiselvi P
INSERT INTO public.service_providers (id, business_name, category, status, updated_at)
VALUES ('4d00a1da-7db8-4371-8f9b-916dc4797a0f', 'Kalaiselvi P', 'Event Organiser', 'Active', NOW())
ON CONFLICT (id) DO UPDATE SET business_name = EXCLUDED.business_name, category = EXCLUDED.category;

-- Madu S
INSERT INTO public.service_providers (id, business_name, category, status, updated_at)
VALUES ('7f918d1f-57e2-48f9-a95d-d2a63387fcf1', 'Madu S', 'Mehendi Artist', 'Active', NOW())
ON CONFLICT (id) DO UPDATE SET business_name = EXCLUDED.business_name, category = EXCLUDED.category;

-- Sriharini
INSERT INTO public.service_providers (id, business_name, category, status, updated_at)
VALUES ('c271599b-1b65-463f-a6ca-d1f9b0985993', 'Sriharini Mehendi Art', 'Mehendi Artist', 'Active', NOW())
ON CONFLICT (id) DO UPDATE SET business_name = EXCLUDED.business_name, category = EXCLUDED.category;

-- Jasmine Fathima
INSERT INTO public.service_providers (id, business_name, category, status, updated_at)
VALUES ('ded3908d-be5b-4470-9e04-bcdf157641bb', 'Jasmine Fathima', 'Henna Artist', 'Active', NOW())
ON CONFLICT (id) DO UPDATE SET business_name = EXCLUDED.business_name, category = EXCLUDED.category;

-- 5. Cleanup Legacy Structures
DROP VIEW IF EXISTS public.organiser_details;
DROP TABLE IF EXISTS public.organiser_details_old;
-- We will DROP public.organisers AFTER verifying the application logic still works with vendors only

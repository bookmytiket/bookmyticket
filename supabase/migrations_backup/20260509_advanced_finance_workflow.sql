-- 1. Update stakeholder tables with custom fee overrides
ALTER TABLE public.organisers
ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC(5, 2) DEFAULT 7.00,
ADD COLUMN IF NOT EXISTS payout_fee_flat NUMERIC(12, 2) DEFAULT 10.00;

ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC(5, 2) DEFAULT 7.00,
ADD COLUMN IF NOT EXISTS payout_fee_flat NUMERIC(12, 2) DEFAULT 10.00;

-- 2. Update withdraw_requests with detailed financial columns
ALTER TABLE public.withdraw_requests
ADD COLUMN IF NOT EXISTS processing_fee NUMERIC(12, 2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS gst_on_fee NUMERIC(12, 2) DEFAULT 1.80,
ADD COLUMN IF NOT EXISTS net_payable NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS bank_reference_id TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 3. Extend Platform Revenue Ledger
ALTER TABLE public.platform_revenue
ADD COLUMN IF NOT EXISTS partner_share NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS net_platform_revenue NUMERIC(12, 2) DEFAULT 0.00;

-- 4. Audit & Compliance Table Infrastructure
CREATE TABLE IF NOT EXISTS public.gst_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID,
    source TEXT, -- 'platform_fee', 'payout_fee'
    taxable_amount NUMERIC(12, 2),
    gst_amount NUMERIC(12, 2),
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partner_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id),
    partner_id UUID REFERENCES public.profiles(id),
    commission_amount NUMERIC(12, 2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settlement_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES public.profiles(id),
    provider_type TEXT,
    amount NUMERIC(12, 2),
    fee_deducted NUMERIC(12, 2),
    net_paid NUMERIC(12, 2),
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    actor_id UUID,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Update the View for administrative consistency
CREATE OR REPLACE VIEW public.organiser_details AS
SELECT id, business_name, category, type, description, kyc_status, is_approved, wallet_balance, kyc_details, NULL::BOOLEAN as force_password_change, lat, lng, updated_at, platform_fee_percent, payout_fee_flat FROM public.vendors
UNION ALL
SELECT id, business_name, NULL as category, type, NULL as description, kyc_status, is_approved, wallet_balance, kyc_details, force_password_change, lat, lng, updated_at, platform_fee_percent, payout_fee_flat FROM public.organisers;

-- 6. Mutation handler for the view
CREATE OR REPLACE FUNCTION public.handle_organiser_details_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.type = 'professional_service') THEN
            INSERT INTO public.vendors (id, business_name, category, type, description, kyc_status, is_approved, wallet_balance, kyc_details, lat, lng, updated_at, platform_fee_percent, payout_fee_flat)
            VALUES (NEW.id, NEW.business_name, NEW.category, NEW.type, NEW.description, NEW.kyc_status, NEW.is_approved, NEW.wallet_balance, NEW.kyc_details, NEW.lat, NEW.lng, NOW(), COALESCE(NEW.platform_fee_percent, 7.00), COALESCE(NEW.payout_fee_flat, 10.00));
        ELSE
            INSERT INTO public.organisers (id, business_name, type, kyc_status, is_approved, wallet_balance, kyc_details, force_password_change, lat, lng, updated_at, platform_fee_percent, payout_fee_flat)
            VALUES (NEW.id, NEW.business_name, NEW.type, NEW.kyc_status, NEW.is_approved, NEW.wallet_balance, NEW.kyc_details, COALESCE(NEW.force_password_change, false), NEW.lat, NEW.lng, NOW(), COALESCE(NEW.platform_fee_percent, 7.00), COALESCE(NEW.payout_fee_flat, 10.00));
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
                platform_fee_percent = NEW.platform_fee_percent,
                payout_fee_flat = NEW.payout_fee_flat,
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
                platform_fee_percent = NEW.platform_fee_percent,
                payout_fee_flat = NEW.payout_fee_flat,
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

-- 7. Revenue Distribution Engine (Enhanced for custom fees)
CREATE OR REPLACE FUNCTION public.process_revenue_split()
RETURNS TRIGGER AS $$
DECLARE
    v_base_amount NUMERIC(12, 2);
    v_platform_fee NUMERIC(12, 2);
    v_fee_percent NUMERIC(5, 2);
    v_gst_amount NUMERIC(12, 2);
    v_partner_share NUMERIC(12, 2);
    v_net_revenue NUMERIC(12, 2);
    v_provider_id UUID;
    v_provider_type TEXT;
BEGIN
    IF (NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success')) THEN
        -- Determine Provider and Type
        IF NEW.type = 'event' THEN
            SELECT organiser_id INTO v_provider_id FROM public.bookings WHERE id = NEW.booking_id;
            v_provider_type := 'organiser';
            SELECT platform_fee_percent INTO v_fee_percent FROM public.organisers WHERE id = v_provider_id;
        ELSE
            SELECT service_provider_id INTO v_provider_id FROM public.service_orders WHERE payment_id = NEW.id;
            v_provider_type := 'vendor';
            SELECT platform_fee_percent INTO v_fee_percent FROM public.vendors WHERE id = v_provider_id;
        END IF;

        v_fee_percent := COALESCE(v_fee_percent, 7.00);
        v_base_amount := COALESCE(NEW.base_amount, NEW.amount / (1 + (v_fee_percent/100) * 1.18)); 
        v_platform_fee := v_base_amount * (v_fee_percent / 100);
        v_gst_amount := v_platform_fee * 0.18;
        v_partner_share := v_base_amount * 0.002;
        v_net_revenue := v_platform_fee - v_partner_share;

        -- Credit Wallet
        IF v_provider_type = 'organiser' THEN
            INSERT INTO public.organiser_wallet (organiser_id, balance) VALUES (v_provider_id, v_base_amount)
            ON CONFLICT (organiser_id) DO UPDATE SET balance = public.organiser_wallet.balance + v_base_amount, updated_at = NOW();
        ELSE
            INSERT INTO public.provider_wallet (service_provider_id, balance) VALUES (v_provider_id, v_base_amount)
            ON CONFLICT (service_provider_id) DO UPDATE SET balance = public.provider_wallet.balance + v_base_amount, updated_at = NOW();
        END IF;

        INSERT INTO public.wallet_transactions (provider_id, provider_type, amount, type, description)
        VALUES (v_provider_id, v_provider_type, v_base_amount, 'credit', 'Revenue split (at ' || v_fee_percent || '%) from booking #' || COALESCE(NEW.booking_id::text, NEW.id::text));

        INSERT INTO public.platform_revenue (payment_id, platform_fee, gst_amount, partner_share, net_platform_revenue, total_revenue)
        VALUES (NEW.id, v_platform_fee, v_gst_amount, v_partner_share, v_net_revenue, v_platform_fee + v_gst_amount);

        INSERT INTO public.gst_reports (payment_id, source, taxable_amount, gst_amount)
        VALUES (NEW.id, 'platform_fee', v_platform_fee, v_gst_amount);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Withdrawal Logic (Enhanced for custom fees)
CREATE OR REPLACE FUNCTION public.process_withdrawal_request()
RETURNS TRIGGER AS $$
DECLARE
    v_payout_fee NUMERIC(12, 2);
BEGIN
    IF (TG_OP = 'INSERT') THEN
        SELECT payout_fee_flat INTO v_payout_fee FROM public.organisers WHERE id = NEW.organiser_id;
        IF v_payout_fee IS NULL THEN
            SELECT payout_fee_flat INTO v_payout_fee FROM public.vendors WHERE id = NEW.organiser_id;
        END IF;
        
        NEW.processing_fee := COALESCE(v_payout_fee, 10.00);
        NEW.gst_on_fee := NEW.processing_fee * 0.18;
        NEW.net_payable := NEW.amount - NEW.processing_fee - NEW.gst_on_fee;
    END IF;
    
    IF (NEW.status = 'processed' AND (OLD.status IS NULL OR OLD.status != 'processed')) THEN
        UPDATE public.organiser_wallet SET balance = balance - NEW.amount WHERE organiser_id = NEW.organiser_id;
        UPDATE public.provider_wallet SET balance = balance - NEW.amount WHERE service_provider_id = NEW.organiser_id;
        
        INSERT INTO public.gst_reports (payment_id, source, taxable_amount, gst_amount)
        VALUES (NEW.id, 'payout_fee', NEW.processing_fee, NEW.gst_on_fee);
        
        INSERT INTO public.settlement_history (provider_id, amount, fee_deducted, net_paid)
        VALUES (NEW.organiser_id, NEW.amount, NEW.processing_fee + NEW.gst_on_fee, NEW.net_payable);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create a View for GST Reporting
CREATE OR REPLACE VIEW public.gst_audit_report AS
SELECT 
    'Platform Fee' as source,
    payment_id::text as reference,
    platform_fee as taxable_value,
    gst_amount as gst_collected,
    created_at
FROM public.platform_revenue
UNION ALL
SELECT 
    'Payout Processing' as source,
    id::text as reference,
    processing_fee as taxable_value,
    gst_on_fee as gst_collected,
    created_at
FROM public.withdraw_requests
WHERE status = 'processed';

-- 10. Apply the Triggers
DROP TRIGGER IF EXISTS tr_split_revenue ON public.payments;
CREATE TRIGGER tr_split_revenue
AFTER UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.process_revenue_split();

DROP TRIGGER IF EXISTS tr_calculate_withdrawal_fees ON public.withdraw_requests;
CREATE TRIGGER tr_calculate_withdrawal_fees
BEFORE INSERT OR UPDATE ON public.withdraw_requests
FOR EACH ROW
EXECUTE FUNCTION public.process_withdrawal_request();

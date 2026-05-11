-- Comprehensive Subscription Management System & Auto-Block Workflow
-- 1. Enhance staff_packages with Dynamic Pricing Control
ALTER TABLE public.staff_packages 
ADD COLUMN IF NOT EXISTS monthly_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC DEFAULT 18,
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;

-- 2. Enhance organiser_subscriptions (Rename payment_status if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organiser_subscriptions' AND column_name='payment_status') THEN
        ALTER TABLE public.organiser_subscriptions RENAME COLUMN payment_status TO subscription_status;
    END IF;
END $$;

-- 3. Create subscription_payments (Consolidating payment_transactions)
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organiser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.staff_packages(id),
    transaction_id TEXT UNIQUE,
    payment_status TEXT, -- 'success', 'failed', 'pending'
    paid_amount NUMERIC,
    gst_amount NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create subscription_logs
CREATE TABLE IF NOT EXISTS public.subscription_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organiser_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT, -- 'activation', 'expiry', 'renewal', 'blocking', 'payment_failed'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Update staff table for account status
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active'; -- 'active', 'blocked'

-- 6. Function to validate and sync staff access
-- This function blocks extra staff if subscription is expired and unblocks if active.
CREATE OR REPLACE FUNCTION public.sync_staff_subscription_status()
RETURNS TRIGGER AS $$
DECLARE
    v_staff_limit INTEGER;
    v_is_expired BOOLEAN;
BEGIN
    -- Get the staff limit from the package
    SELECT staff_limit INTO v_staff_limit
    FROM public.staff_packages
    WHERE id = NEW.package_id;

    -- Default free limit is 3
    IF v_staff_limit IS NULL THEN
        v_staff_limit := 3;
    END IF;

    -- Check if subscription is expired or status is not active
    v_is_expired := (NEW.active_until < now()) OR (NEW.subscription_status != 'active');

    IF v_is_expired THEN
        -- Block extra staff if expired (Keep first 3 as free limit)
        -- First, ensure all staff are considered, then block those above the free limit (3)
        UPDATE public.staff
        SET account_status = 'blocked'
        WHERE organiser_id = NEW.organiser_id
        AND id IN (
            SELECT id FROM public.staff
            WHERE organiser_id = NEW.organiser_id
            ORDER BY created_at ASC
            OFFSET 3
        );
        
        -- Ensure first 3 are active
        UPDATE public.staff
        SET account_status = 'active'
        WHERE organiser_id = NEW.organiser_id
        AND id IN (
            SELECT id FROM public.staff
            WHERE organiser_id = NEW.organiser_id
            ORDER BY created_at ASC
            LIMIT 3
        );

        -- Log expiry only if status changed or it's a new record
        IF (TG_OP = 'INSERT') OR (OLD.subscription_status = 'active' AND NEW.subscription_status != 'active') OR (OLD.active_until >= now() AND NEW.active_until < now()) THEN
            INSERT INTO public.subscription_logs (organiser_id, action_type, details)
            VALUES (NEW.organiser_id, 'expiry', jsonb_build_object(
                'package_id', NEW.package_id, 
                'active_until', NEW.active_until,
                'previous_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.subscription_status ELSE NULL END
            ));
        END IF;
    ELSE
        -- Subscription is active
        -- Unblock staff up to the new limit
        UPDATE public.staff
        SET account_status = 'active'
        WHERE organiser_id = NEW.organiser_id
        AND id IN (
            SELECT id FROM public.staff
            WHERE organiser_id = NEW.organiser_id
            ORDER BY created_at ASC
            LIMIT v_staff_limit
        );

        -- Block any staff exceeding the new limit (if any)
        UPDATE public.staff
        SET account_status = 'blocked'
        WHERE organiser_id = NEW.organiser_id
        AND id NOT IN (
            SELECT id FROM public.staff
            WHERE organiser_id = NEW.organiser_id
            ORDER BY created_at ASC
            LIMIT v_staff_limit
        );
        
        -- Log activation/renewal
        IF (TG_OP = 'INSERT') OR (OLD.subscription_status != 'active' AND NEW.subscription_status = 'active') OR (NEW.active_until > OLD.active_until) THEN
            INSERT INTO public.subscription_logs (organiser_id, action_type, details)
            VALUES (NEW.organiser_id, 'activation', jsonb_build_object(
                'package_id', NEW.package_id, 
                'active_until', NEW.active_until,
                'staff_limit', v_staff_limit
            ));
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscription updates
DROP TRIGGER IF EXISTS tr_sync_staff_subscription ON public.organiser_subscriptions;
CREATE TRIGGER tr_sync_staff_subscription
AFTER INSERT OR UPDATE ON public.organiser_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_subscription_status();

-- 7. Automated Expiry Check (Function to be called by Cron or Edge Function)
CREATE OR REPLACE FUNCTION public.check_expired_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE public.organiser_subscriptions
    SET subscription_status = 'expired'
    WHERE subscription_status = 'active'
    AND active_until < now();
END;
$$ LANGUAGE plpgsql;

-- 8. Enable Realtime for relevant tables
ALTER publication supabase_realtime ADD TABLE public.organiser_subscriptions;
ALTER publication supabase_realtime ADD TABLE public.staff;
ALTER publication supabase_realtime ADD TABLE public.staff_packages;

-- 9. RLS Policies
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Organisers can view their own payments" ON public.subscription_payments;
    DROP POLICY IF EXISTS "Organisers can view their own logs" ON public.subscription_logs;
    DROP POLICY IF EXISTS "Admins can manage all payments" ON public.subscription_payments;
    DROP POLICY IF EXISTS "Admins can manage all logs" ON public.subscription_logs;
END $$;

CREATE POLICY "Organisers can view their own payments" ON public.subscription_payments
    FOR SELECT USING (auth.uid() = organiser_id);

CREATE POLICY "Organisers can view their own logs" ON public.subscription_logs
    FOR SELECT USING (auth.uid() = organiser_id);

CREATE POLICY "Admins can manage all payments" ON public.subscription_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all logs" ON public.subscription_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 10. Seed/Update Packages with dynamic pricing
UPDATE public.staff_packages SET monthly_price = 0, gst_percentage = 0, discount_percentage = 0 WHERE package_name = 'Free Plan';
UPDATE public.staff_packages SET monthly_price = 999, gst_percentage = 18, discount_percentage = 0 WHERE package_name = 'Starter Plan';
UPDATE public.staff_packages SET monthly_price = 2999, gst_percentage = 18, discount_percentage = 0 WHERE package_name = 'Professional Plan';
UPDATE public.staff_packages SET monthly_price = 9999, gst_percentage = 18, discount_percentage = 0 WHERE package_name = 'Enterprise Plan';

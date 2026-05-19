-- Fix missing columns in subscription tables
-- 1. Add last_payment_id to organiser_subscriptions
ALTER TABLE public.organiser_subscriptions 
ADD COLUMN IF NOT EXISTS last_payment_id TEXT;

-- 2. Add description and gateway to subscription_payments for better tracking
ALTER TABLE public.subscription_payments
ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'Razorpay',
ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_order_id TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Ensure staff_packages has correct field names for all codebases
-- Some parts of the code might still use package_price
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff_packages' AND column_name='package_price') THEN
        -- Keep package_price for backward compatibility but sync with monthly_price
        UPDATE public.staff_packages SET package_price = monthly_price WHERE package_price != monthly_price;
    END IF;
END $$;

-- 4. Update the sync function to be more robust
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
        UPDATE public.staff
        SET account_status = 'blocked'
        WHERE organiser_id = NEW.organiser_id
        AND id IN (
            SELECT id FROM public.staff
            WHERE organiser_id = NEW.organiser_id
            ORDER BY created_at ASC
            OFFSET 3
        );
        
        UPDATE public.staff
        SET account_status = 'active'
        WHERE organiser_id = NEW.organiser_id
        AND id IN (
            SELECT id FROM public.staff
            WHERE organiser_id = NEW.organiser_id
            ORDER BY created_at ASC
            LIMIT 3
        );
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

        -- Block any staff exceeding the new limit
        UPDATE public.staff
        SET account_status = 'blocked'
        WHERE organiser_id = NEW.organiser_id
        AND id NOT IN (
            SELECT id FROM public.staff
            WHERE organiser_id = NEW.organiser_id
            ORDER BY created_at ASC
            LIMIT v_staff_limit
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

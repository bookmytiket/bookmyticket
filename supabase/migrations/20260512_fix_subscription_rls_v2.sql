-- Fix RLS for staff_packages and related subscription tables
-- Also updates the global is_admin helper to recognize new administrative roles

-- 1. Update is_admin helper to include all administrative tiers (admin, super_admin, system_admin)
-- This ensures that the new roles are recognized across all existing administrative RLS policies
CREATE OR REPLACE FUNCTION public.is_admin(u_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins WHERE id = u_id
        UNION
        SELECT 1 FROM public.profiles 
        WHERE id = u_id 
        AND role IN ('admin', 'super_admin', 'system_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. staff_packages
ALTER TABLE public.staff_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage staff packages" ON public.staff_packages;
CREATE POLICY "Admins can manage staff packages" ON public.staff_packages
    FOR ALL USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- 3. organiser_subscriptions
ALTER TABLE public.organiser_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage organiser_subscriptions" ON public.organiser_subscriptions;
CREATE POLICY "Admins can manage organiser_subscriptions" ON public.organiser_subscriptions
    FOR ALL USING (is_admin(auth.uid()));

-- 4. subscription_payments
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.subscription_payments;
CREATE POLICY "Admins can manage all payments" ON public.subscription_payments
    FOR ALL USING (is_admin(auth.uid()));

-- 5. subscription_logs
ALTER TABLE public.subscription_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all logs" ON public.subscription_logs;
CREATE POLICY "Admins can manage all logs" ON public.subscription_logs
    FOR ALL USING (is_admin(auth.uid()));

-- 6. payment_transactions (Legacy table used in some parts)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.payment_transactions;
CREATE POLICY "Admins can manage all transactions" ON public.payment_transactions
    FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- BookMyTicket — ORGANISER ACCESS RESTORATION
-- ============================================================

-- 1. Allow organisers to view their own profile record
DROP POLICY IF EXISTS "Organisers can view their own record" ON public.organisers;
CREATE POLICY "Organisers can view their own record" ON public.organisers 
    FOR SELECT USING (auth.uid() = id);

-- 2. Allow organisers to update their own profile (e.g., for onboarding)
DROP POLICY IF EXISTS "Organisers can update their own record" ON public.organisers;
CREATE POLICY "Organisers can update their own record" ON public.organisers 
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. Allow organisers to insert their own record (if it doesn't exist yet)
DROP POLICY IF EXISTS "Organisers can insert their own record" ON public.organisers;
CREATE POLICY "Organisers can insert their own record" ON public.organisers 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Allow organisers to view their own KYC details
DROP POLICY IF EXISTS "Organisers can view their own kyc_details" ON public.kyc_details;
CREATE POLICY "Organisers can view their own kyc_details" ON public.kyc_details 
    FOR SELECT USING (auth.uid() = id);

-- 5. Allow organisers to manage their own KYC details
DROP POLICY IF EXISTS "Organisers can manage their own kyc_details" ON public.kyc_details;
CREATE POLICY "Organisers can manage their own kyc_details" ON public.kyc_details 
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 6. Allow everyone to view subscription packages
DROP POLICY IF EXISTS "Anyone can view staff packages" ON public.staff_packages;
CREATE POLICY "Anyone can view staff packages" ON public.staff_packages 
    FOR SELECT USING (true);

-- 7. Allow organisers to view their own subscriptions
DROP POLICY IF EXISTS "Organisers can view their own subscriptions" ON public.organiser_subscriptions;
CREATE POLICY "Organisers can view their own subscriptions" ON public.organiser_subscriptions 
    FOR SELECT USING (auth.uid() = organiser_id);

-- 8. Allow organisers to view their own payments
DROP POLICY IF EXISTS "Organisers can view their own payments" ON public.subscription_payments;
CREATE POLICY "Organisers can view their own payments" ON public.subscription_payments 
    FOR SELECT USING (auth.uid() = organiser_id);

-- 9. Allow organisers to submit withdrawal requests
DROP POLICY IF EXISTS "Organisers can insert their own withdrawal requests" ON public.withdraw_requests;
CREATE POLICY "Organisers can insert their own withdrawal requests" ON public.withdraw_requests 
    FOR INSERT WITH CHECK (auth.uid() = organiser_id);

-- 10. Allow organisers to view their own withdrawal requests
DROP POLICY IF EXISTS "Organisers can view their own withdrawal requests" ON public.withdraw_requests;
CREATE POLICY "Organisers can view their own withdrawal requests" ON public.withdraw_requests 
    FOR SELECT USING (auth.uid() = organiser_id);

-- 11. Allow organisers to view their own wallet balance
DROP POLICY IF EXISTS "Organisers can view their own wallet" ON public.organiser_wallet;
CREATE POLICY "Organisers can view their own wallet" ON public.organiser_wallet 
    FOR SELECT USING (auth.uid() = organiser_id);

-- 12. Allow organisers to update their own wallet (e.g. for withdrawal debits)
DROP POLICY IF EXISTS "Organisers can update their own wallet" ON public.organiser_wallet;
CREATE POLICY "Organisers can update their own wallet" ON public.organiser_wallet 
    FOR UPDATE USING (auth.uid() = organiser_id) WITH CHECK (auth.uid() = organiser_id);

-- 13. Allow organisers to view their own transactions
DROP POLICY IF EXISTS "Organisers can view their own transactions" ON public.wallet_transactions;
CREATE POLICY "Organisers can view their own transactions" ON public.wallet_transactions 
    FOR SELECT USING (auth.uid() = provider_id);

-- 14. Allow organisers to record their own transactions (e.g. for withdrawal logs)
DROP POLICY IF EXISTS "Organisers can insert their own transactions" ON public.wallet_transactions;
CREATE POLICY "Organisers can insert their own transactions" ON public.wallet_transactions 
    FOR INSERT WITH CHECK (auth.uid() = provider_id);

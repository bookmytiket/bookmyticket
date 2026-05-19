-- ============================================================
-- BookMyTicket — Strict Multi-Role Data Isolation (RLS)
-- ============================================================

-- 1. Enable RLS on all relevant tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scanner_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.provider_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Clear existing policies to avoid conflicts
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. PROFILES: Users manage own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 4. EVENTS: Organisers manage own events, Public see published
CREATE POLICY "Organisers manage own events" ON public.events
    FOR ALL TO authenticated USING (organiser_id = auth.uid()) WITH CHECK (organiser_id = auth.uid());
CREATE POLICY "Public can view published events" ON public.events
    FOR SELECT USING (publish_status = 'published');

-- 5. BOOKINGS: Users see own bookings, Organisers see event bookings
CREATE POLICY "Users see own bookings" ON public.bookings
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Organisers see event bookings" ON public.bookings
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.events WHERE events.id = bookings.event_id AND events.organiser_id = auth.uid())
    );

-- 6. WALLETS: Only owner can view
CREATE POLICY "Users view own wallet" ON public.wallets
    FOR SELECT TO authenticated USING (organiser_id = auth.uid());

-- 7. STAFF: Organisers manage own staff
CREATE POLICY "Organisers manage own staff" ON public.staff
    FOR ALL TO authenticated USING (organiser_id = auth.uid()) WITH CHECK (organiser_id = auth.uid());

-- 8. SCANNER LOGS: Organisers see own event logs
CREATE POLICY "Organisers see own scanner logs" ON public.scanner_logs
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.events WHERE events.id = scanner_logs.event_id AND events.organiser_id = auth.uid())
    );

-- 9. SERVICE PROVIDERS: Providers manage own profile
CREATE POLICY "Providers manage own profile" ON public.service_providers
    FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 10. PROVIDER SERVICES: Providers manage own services
CREATE POLICY "Providers manage own services" ON public.provider_services
    FOR ALL TO authenticated USING (provider_id = auth.uid()) WITH CHECK (provider_id = auth.uid());

-- 11. SERVICE BOOKINGS: Customer + Provider access
CREATE POLICY "Participants access service bookings" ON public.service_bookings
    FOR ALL TO authenticated USING (customer_id = auth.uid() OR provider_id = auth.uid());

-- 12. VENDORS: Vendors manage own profile
CREATE POLICY "Vendors manage own profile" ON public.vendors
    FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 13. PROVIDER WALLETS: Only owner can view
CREATE POLICY "Providers view own wallet" ON public.provider_wallets
    FOR SELECT TO authenticated USING (provider_id = auth.uid());

-- 14. NOTIFICATIONS: Users see own
CREATE POLICY "Users see own notifications" ON public.notifications
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 15. CHAT: Participants access threads/messages
CREATE POLICY "Participants access threads" ON public.chat_threads
    FOR ALL TO authenticated USING (customer_id = auth.uid() OR provider_id = auth.uid());
CREATE POLICY "Participants access messages" ON public.chat_messages
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.chat_threads WHERE chat_threads.id = chat_messages.thread_id AND (customer_id = auth.uid() OR provider_id = auth.uid()))
    );

-- 16. ADMIN: Override for all
CREATE POLICY "Admins full access" ON public.profiles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
-- (Repeat for other tables if necessary, but usually service role is used for admin tools)

-- Unified BookMyTicket sync architecture.
-- This migration makes Supabase the single source of truth for every client:
-- web, Expo mobile, admin, organiser and staff scanner.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Canonical device registry for push tokens, stale-client checks and app version compatibility.
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'expo',
  device_id TEXT NOT NULL,
  push_token TEXT,
  app_version TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, device_id)
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  platform_scope TEXT NOT NULL DEFAULT 'all',
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sync_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client TEXT NOT NULL DEFAULT 'mobile',
  resource TEXT,
  action TEXT,
  error_message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  app_version TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.api_client_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  min_supported_version TEXT NOT NULL DEFAULT '1.0.0',
  latest_version TEXT,
  force_upgrade BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tables below may already exist in production. IF NOT EXISTS plus ALTER keeps the
-- migration safe across partially upgraded environments.
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  ticket_number TEXT,
  ticket_code TEXT,
  qr_token TEXT,
  qr_code TEXT,
  status TEXT DEFAULT 'active',
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  seat_id TEXT,
  ticket_category_id UUID,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  gateway TEXT,
  payment_gateway TEXT,
  status TEXT DEFAULT 'pending',
  amount NUMERIC(12,2),
  total_amount NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  message TEXT,
  body TEXT,
  type TEXT,
  channel TEXT DEFAULT 'in_app',
  status TEXT DEFAULT 'unread',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.seat_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  showtime_id UUID,
  seat_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  locked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  lock_expires_at TIMESTAMP WITH TIME ZONE,
  reserved_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.general_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  showtime_id UUID,
  ticket_category_id UUID,
  total_capacity INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  reserved_count INTEGER DEFAULT 0,
  remaining_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  organiser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payout_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_ref TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_status TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

UPDATE public.bookings
SET
  booking_status = COALESCE(booking_status, status, 'Pending'),
  payment_status = COALESCE(payment_status, CASE WHEN status = 'Confirmed' THEN 'paid' ELSE 'pending' END),
  booking_ref = COALESCE(booking_ref, upper(right(id::text, 8)))
WHERE booking_status IS NULL OR payment_status IS NULL OR booking_ref IS NULL;

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS showtime_id UUID;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.booking_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'in_app';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
UPDATE public.notifications SET body = COALESCE(body, message) WHERE body IS NULL;

ALTER TABLE public.seat_inventory ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.seat_inventory ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
UPDATE public.seat_inventory SET reserved_until = COALESCE(reserved_until, lock_expires_at) WHERE reserved_until IS NULL;

ALTER TABLE public.general_inventory ADD COLUMN IF NOT EXISTS showtime_id UUID;
ALTER TABLE public.general_inventory ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'organizer';
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS organiser_id UUID;
UPDATE public.wallets
SET
  owner_id = COALESCE(owner_id, user_id, organiser_id),
  organiser_id = COALESCE(organiser_id, user_id, owner_id),
  owner_type = COALESCE(owner_type, wallet_type, 'organizer')
WHERE owner_id IS NULL OR organiser_id IS NULL OR owner_type IS NULL;

ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS organiser_id UUID;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
UPDATE public.wallet_transactions wt
SET
  owner_id = COALESCE(wt.owner_id, w.owner_id, w.user_id, w.organiser_id),
  organiser_id = COALESCE(wt.organiser_id, w.organiser_id, w.user_id, w.owner_id),
  type = COALESCE(wt.type, wt.transaction_type)
FROM public.wallets w
WHERE wt.wallet_id = w.id
  AND (wt.owner_id IS NULL OR wt.organiser_id IS NULL OR wt.type IS NULL);

ALTER TABLE public.withdraw_requests ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.withdraw_requests ADD COLUMN IF NOT EXISTS organiser_id UUID;
UPDATE public.withdraw_requests
SET
  owner_id = COALESCE(owner_id, organiser_id),
  organiser_id = COALESCE(organiser_id, owner_id)
WHERE owner_id IS NULL OR organiser_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS seat_inventory_unique_showtime_seat
ON public.seat_inventory (event_id, COALESCE(showtime_id, '00000000-0000-0000-0000-000000000000'::uuid), seat_number);

CREATE UNIQUE INDEX IF NOT EXISTS general_inventory_unique_category_showtime
ON public.general_inventory (event_id, COALESCE(showtime_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(ticket_category_id, '00000000-0000-0000-0000-000000000000'::uuid));

DO $$
DECLARE
  target_table TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'devices',
    'feature_flags',
    'api_client_versions',
    'bookings',
    'booking_items',
    'payments',
    'tickets',
    'seat_inventory',
    'general_inventory',
    'wallets',
    'wallet_transactions',
    'notifications'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS touch_%I_updated_at ON public.%I', target_table, target_table);
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = target_table
        AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('CREATE TRIGGER touch_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', target_table, target_table);
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_client_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own devices" ON public.devices;
CREATE POLICY "Users manage own devices" ON public.devices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Clients read enabled feature flags" ON public.feature_flags;
CREATE POLICY "Clients read enabled feature flags" ON public.feature_flags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create own sync failures" ON public.sync_failures;
CREATE POLICY "Users create own sync failures" ON public.sync_failures FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read sync failures" ON public.sync_failures;
CREATE POLICY "Admins read sync failures" ON public.sync_failures FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Clients read API versions" ON public.api_client_versions;
CREATE POLICY "Clients read API versions" ON public.api_client_versions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users read own booking items" ON public.booking_items;
CREATE POLICY "Users read own booking items" ON public.booking_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_items.booking_id AND b.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users read own tickets" ON public.tickets;
CREATE POLICY "Users read own tickets" ON public.tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = tickets.booking_id AND b.user_id = auth.uid())
);

INSERT INTO public.feature_flags (feature_key, enabled, platform_scope, description)
VALUES
  ('multi_show_booking', true, 'all', 'Multiple showtime booking flow'),
  ('coupon_engine', true, 'all', 'Shared coupon and partner offer engine'),
  ('staff_verification', true, 'all', 'Shared staff QR validation'),
  ('general_events', true, 'all', 'General admission inventory'),
  ('partner_rewards', true, 'all', 'Partner reward campaign support'),
  ('qr_tickets', true, 'all', 'Secure QR ticket generation and validation'),
  ('unified_realtime', true, 'all', 'Supabase realtime event bus'),
  ('offline_queue', true, 'expo,mobile', 'Expo offline retry queue')
ON CONFLICT (feature_key) DO UPDATE
SET enabled = EXCLUDED.enabled,
    platform_scope = EXCLUDED.platform_scope,
    updated_at = timezone('utc'::text, now());

INSERT INTO public.api_client_versions (platform, min_supported_version, latest_version, force_upgrade)
VALUES
  ('web', '1.0.0', '1.0.0', false),
  ('expo', '1.0.0', '1.0.0', false),
  ('admin', '1.0.0', '1.0.0', false),
  ('staff', '1.0.0', '1.0.0', false)
ON CONFLICT (platform) DO UPDATE
SET min_supported_version = EXCLUDED.min_supported_version,
    latest_version = EXCLUDED.latest_version,
    force_upgrade = EXCLUDED.force_upgrade,
    updated_at = timezone('utc'::text, now());

DO $$
DECLARE
  target_table TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'events',
    'event_showtimes',
    'bookings',
    'booking_items',
    'payments',
    'tickets',
    'seat_inventory',
    'general_inventory',
    'wallets',
    'wallet_transactions',
    'notifications',
    'coupons',
    'partner_campaigns',
    'coupon_usage',
    'ticket_scan_logs',
    'feature_flags',
    'devices'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = target_table
    )
      AND NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = target_table
      )
    THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', target_table);
    END IF;
  END LOOP;
END $$;

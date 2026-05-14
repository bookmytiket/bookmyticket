-- ============================================================
-- BookMyTicket — Final Roadmap Migration
-- Implementation of Seat Locking, Chat, Fraud Detection, 
-- Scanner Monitoring, Push Notifications, and Provider Enhancements.
-- ============================================================

-- 1. SEAT LOCKING ENHANCEMENTS
ALTER TABLE public.seat_inventory ADD COLUMN IF NOT EXISTS lock_expires_at TIMESTAMPTZ;
ALTER TABLE public.seat_inventory ADD COLUMN IF NOT EXISTS seat_map_id UUID REFERENCES public.seat_layouts(id);

CREATE TABLE IF NOT EXISTS public.seat_lock_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seat_id UUID NOT NULL REFERENCES public.seat_inventory(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'locked', 'released', 'sold', 'expired'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROVIDER BOOKING MANAGEMENT ENHANCEMENTS
ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS conflict_flag BOOLEAN DEFAULT false;
ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS schedule_status TEXT DEFAULT 'scheduled'; -- 'scheduled', 'rescheduled', 'conflict'
ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS assigned_provider_user UUID REFERENCES auth.users(id);
ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS reschedule_requested_at TIMESTAMPTZ;

-- Ensure service_providers has organiser_id for dashboard linkage
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS organiser_id UUID REFERENCES auth.users(id);


ALTER TABLE public.provider_availability ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.provider_availability ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.provider_availability ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.provider_schedule_conflicts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.service_bookings(id) ON DELETE CASCADE,
    conflict_reason TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. IN-APP CHAT SYSTEM
CREATE TABLE IF NOT EXISTS public.chat_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.service_bookings(id) ON DELETE SET NULL,
    event_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    provider_id UUID REFERENCES public.service_providers(id),
    organiser_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active', -- 'active', 'archived'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role TEXT NOT NULL, -- 'customer', 'provider', 'organiser', 'admin'
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(thread_id, user_id)
);

-- Ensure columns exist if table was already there
ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE;
ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.chat_participants ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();


CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE, -- Made nullable initially for migration safety
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    message_type TEXT DEFAULT 'text',
    message_text TEXT,
    media_url TEXT,
    is_delivered BOOLEAN DEFAULT true,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already there from legacy schema
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS message_text TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN DEFAULT true;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;


-- 4. FRAUD DETECTION
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    booking_id UUID, -- Can be event booking or service booking
    fraud_type TEXT NOT NULL, -- 'bulk_buying', 'rapid_grabbing', 'suspicious_refund', 'bot_traffic'
    risk_score INTEGER DEFAULT 0, -- 0-100
    status TEXT DEFAULT 'pending', -- 'pending', 'investigating', 'confirmed', 'dismissed'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.device_fingerprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    device_hash TEXT NOT NULL,
    ip_address TEXT,
    browser TEXT,
    os TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suspicious_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    activity_type TEXT NOT NULL,
    payload JSONB,
    severity TEXT DEFAULT 'low',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SCANNER MONITORING
CREATE TABLE IF NOT EXISTS public.gate_monitoring_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    gate_name TEXT NOT NULL,
    active_entries INTEGER DEFAULT 0,
    avg_scan_rate NUMERIC(10,2) DEFAULT 0, -- scans per minute
    total_validated INTEGER DEFAULT 0,
    total_rejected INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, gate_name)
);

-- 6. FLASH DEALS ENHANCEMENTS
ALTER TABLE public.flash_deals ADD COLUMN IF NOT EXISTS display_priority INTEGER DEFAULT 0;
ALTER TABLE public.flash_deals ADD COLUMN IF NOT EXISTS active_banner TEXT;
ALTER TABLE public.flash_deals ADD COLUMN IF NOT EXISTS targeting_rules JSONB DEFAULT '{}';

-- 7. PUSH NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL, -- 'ios', 'android', 'web'
    expo_push_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, expo_push_token)
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    body TEXT,
    notification_type TEXT,
    delivery_status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROVIDER ANALYTICS
CREATE TABLE IF NOT EXISTS public.provider_analytics_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- 'bookings', 'revenue', 'conversion_rate', 'rating'
    metric_value NUMERIC(15,2) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SERVER-SIDE QR ASSETS
CREATE TABLE IF NOT EXISTS public.ticket_qr_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    qr_payload_hash TEXT NOT NULL,
    qr_storage_url TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ticket_id)
);

-- ============================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================

ALTER TABLE public.seat_lock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_schedule_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_monitoring_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_qr_assets ENABLE ROW LEVEL SECURITY;

-- Chat Policies
CREATE POLICY "Users view own threads" ON public.chat_threads
    FOR SELECT USING (customer_id = auth.uid() OR organiser_id = auth.uid() OR provider_id IN (SELECT id FROM public.service_providers WHERE organiser_id = auth.uid()));

CREATE POLICY "Users view participants" ON public.chat_participants
    FOR SELECT USING (user_id = auth.uid() OR thread_id IN (SELECT id FROM public.chat_threads WHERE customer_id = auth.uid() OR organiser_id = auth.uid()));

CREATE POLICY "Users view/send messages" ON public.chat_messages
    FOR ALL USING (sender_id = auth.uid() OR thread_id IN (SELECT id FROM public.chat_threads WHERE customer_id = auth.uid() OR organiser_id = auth.uid()));

-- Push Token Policy
CREATE POLICY "Users manage own tokens" ON public.push_tokens
    FOR ALL USING (user_id = auth.uid());

-- Other policies (simplified for brevity, standard restricted to owner or service_role)
CREATE POLICY "Users view own notifications logs" ON public.notification_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Providers view own analytics" ON public.provider_analytics_snapshots FOR SELECT USING (provider_id IN (SELECT id FROM public.service_providers WHERE organiser_id = auth.uid()));

-- Realtime Configuration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'seat_inventory') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.seat_inventory;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notification_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_logs;
    END IF;
END $$;

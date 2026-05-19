-- ==========================================
-- Turf Partner Dashboard Complete Schema
-- ==========================================

-- 1. Turf Partners (Extension of Vendors/Profiles)
CREATE TABLE IF NOT EXISTS public.turf_partners (
    id UUID PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    logo_url TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    city TEXT,
    gst_number TEXT,
    bank_details JSONB DEFAULT '{}', -- {account_name, account_number, ifsc, bank_name}
    settings JSONB DEFAULT '{
        "notifications": {"email": true, "push": true, "sms": false},
        "auto_confirm": false
    }',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Turfs / Facilities
CREATE TABLE IF NOT EXISTS public.turfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.turf_partners(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sports_supported TEXT[] DEFAULT '{}', -- ['Football', 'Cricket', 'Badminton']
    images TEXT[] DEFAULT '{}',
    video_url TEXT,
    address TEXT,
    city TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    amenities TEXT[] DEFAULT '{}', -- ['Parking', 'Changing Room', 'Lighting', 'Washroom']
    rules TEXT,
    opening_time TIME DEFAULT '06:00',
    closing_time TIME DEFAULT '23:00',
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'maintenance', 'closed'
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Courts / Pitches (Internal spaces)
CREATE TABLE IF NOT EXISTS public.turf_courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turf_id UUID NOT NULL REFERENCES public.turfs(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Court A", "Pitches 1"
    sport_type TEXT NOT NULL,
    capacity INTEGER DEFAULT 10,
    is_indoor BOOLEAN DEFAULT false,
    base_price DECIMAL(10,2) DEFAULT 0.00,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Slots Management
CREATE TABLE IF NOT EXISTS public.turf_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID NOT NULL REFERENCES public.turf_courts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'available', -- 'available', 'booked', 'blocked', 'maintenance'
    booking_id UUID, -- NULL if available/blocked
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(court_id, date, start_time)
);

-- 5. Bookings
CREATE TABLE IF NOT EXISTS public.turf_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    turf_id UUID NOT NULL REFERENCES public.turfs(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES public.turf_courts(id) ON DELETE CASCADE,
    slot_ids UUID[] NOT NULL,
    booking_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    booking_status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'
    customer_details JSONB, -- {name, phone, email} for guest bookings or sync
    payment_method TEXT,
    transaction_ref TEXT,
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Pricing Rules (Dynamic Pricing)
CREATE TABLE IF NOT EXISTS public.turf_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turf_id UUID NOT NULL REFERENCES public.turfs(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- 'weekend', 'peak', 'holiday', 'promo'
    adjustment_type TEXT DEFAULT 'fixed', -- 'fixed', 'percentage'
    adjustment_value DECIMAL(10,2) NOT NULL,
    start_time TIME,
    end_time TIME,
    days_of_week INTEGER[], -- [0, 6] for weekends
    specific_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Earnings & Payouts
CREATE TABLE IF NOT EXISTS public.turf_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.turf_partners(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.turf_bookings(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'settled', 'withdrawn'
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'turf_slots') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.turf_slots;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'turf_bookings') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.turf_bookings;
    END IF;
END $$;

-- 9. Enable RLS
ALTER TABLE public.turf_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turf_courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turf_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turf_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turf_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turf_earnings ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
CREATE POLICY "Turf partners can view own data" ON public.turf_partners FOR ALL USING (auth.uid() = id);
CREATE POLICY "Turf partners manage own turfs" ON public.turfs FOR ALL USING (partner_id = auth.uid());
CREATE POLICY "Turf partners manage own courts" ON public.turf_courts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.turfs WHERE id = turf_id AND partner_id = auth.uid())
);
CREATE POLICY "Turf partners manage own slots" ON public.turf_slots FOR ALL USING (
    EXISTS (SELECT 1 FROM public.turf_courts tc JOIN public.turfs t ON tc.turf_id = t.id WHERE tc.id = court_id AND t.partner_id = auth.uid())
);
CREATE POLICY "Turf partners view own bookings" ON public.turf_bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.turfs WHERE id = turf_id AND partner_id = auth.uid())
);
CREATE POLICY "Turf partners update own bookings" ON public.turf_bookings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.turfs WHERE id = turf_id AND partner_id = auth.uid())
);

-- 20260425_swimming_pool_services.sql
-- Dedicated category: Swimming Pool Services

-- 1. Create Swimming Pools Table
CREATE TABLE IF NOT EXISTS public.swimming_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    contact_details TEXT,
    images TEXT[] DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    price_per_hour DECIMAL(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'active',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    rating DECIMAL(2, 1) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Pool Slots Table
CREATE TABLE IF NOT EXISTS public.pool_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID REFERENCES public.swimming_pools(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    capacity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Pool Bookings Table (Service Requests)
CREATE TABLE IF NOT EXISTS public.pool_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID REFERENCES public.swimming_pools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    slot_id UUID REFERENCES public.pool_slots(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Completed')),
    notes TEXT,
    price_paid DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Realtime for immediate updates
-- Check if tables are already in publication to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'swimming_pools') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.swimming_pools;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pool_slots') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pool_slots;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pool_bookings') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pool_bookings;
    END IF;
END $$;

-- 5. Enable RLS
ALTER TABLE public.swimming_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_bookings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- SWIMMING POOLS
DROP POLICY IF EXISTS "Swimming pools are viewable by everyone" ON public.swimming_pools;
CREATE POLICY "Swimming pools are viewable by everyone" ON public.swimming_pools
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Partners can manage their own pools" ON public.swimming_pools;
CREATE POLICY "Partners can manage their own pools" ON public.swimming_pools
    FOR ALL USING (auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Admins can view all pools" ON public.swimming_pools;
CREATE POLICY "Admins can view all pools" ON public.swimming_pools
    FOR SELECT USING (is_admin(auth.uid()));

-- POOL SLOTS
DROP POLICY IF EXISTS "Pool slots are viewable by everyone" ON public.pool_slots;
CREATE POLICY "Pool slots are viewable by everyone" ON public.pool_slots
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Partners can manage slots for their pools" ON public.pool_slots;
CREATE POLICY "Partners can manage slots for their pools" ON public.pool_slots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.swimming_pools
            WHERE public.swimming_pools.id = public.pool_slots.pool_id
            AND public.swimming_pools.vendor_id = auth.uid()
        )
    );

-- POOL BOOKINGS (Service Requests)
DROP POLICY IF EXISTS "Users can view own pool bookings" ON public.pool_bookings;
CREATE POLICY "Users can view own pool bookings" ON public.pool_bookings
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.swimming_pools
            WHERE public.swimming_pools.id = public.pool_bookings.pool_id
            AND public.swimming_pools.vendor_id = auth.uid()
        ) OR
        is_admin(auth.uid())
    );

DROP POLICY IF EXISTS "Authenticated users can create pool bookings" ON public.pool_bookings;
CREATE POLICY "Authenticated users can create pool bookings" ON public.pool_bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can update pool booking status" ON public.pool_bookings;
CREATE POLICY "Admins can update pool booking status" ON public.pool_bookings
    FOR UPDATE USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- 7. SAMPLE DATA (Optional, for testing)
-- Insert a sample pool for testing (using a placeholder vendor_id if none exists)
-- This is just for demonstration. In production, vendors will add their own.
/*
INSERT INTO public.swimming_pools (name, description, city, address, lat, lng, amenities, price_per_hour, status)
VALUES 
('The Grand Splash', 'Luxury Olympic-sized swimming pool with temperature control.', 'Kolkata', 'Near Howrah Bridge, CCU', 22.5851, 88.3416, ARRAY['changing room', 'parking', 'trainer'], 350.00, 'active'),
('Backwater Breeze Pool', 'Quiet facility overlooking the backwaters.', 'Kochi', 'Marine Drive, Kochi', 9.9816, 76.2999, ARRAY['changing room', 'cafe', 'parking'], 250.00, 'active');
*/

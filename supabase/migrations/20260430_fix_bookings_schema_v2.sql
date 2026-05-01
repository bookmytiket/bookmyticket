-- Migration: Fix Bookings Schema
-- Adds missing columns used in CheckoutClient for Events and for revenue consistency.

-- 1. Patch bookings (Events)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='gst_amount') THEN
        ALTER TABLE public.bookings ADD COLUMN gst_amount FLOAT8 DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='event_name') THEN
        ALTER TABLE public.bookings ADD COLUMN event_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='location') THEN
        ALTER TABLE public.bookings ADD COLUMN location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='scanned') THEN
        ALTER TABLE public.bookings ADD COLUMN scanned BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='selected_seats') THEN
        ALTER TABLE public.bookings ADD COLUMN selected_seats JSONB DEFAULT '[]';
    END IF;
END $$;

-- 2. Patch turf_bookings (Consistency)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='turf_bookings' AND column_name='gst_amount') THEN
        ALTER TABLE public.turf_bookings ADD COLUMN gst_amount FLOAT8 DEFAULT 0;
    END IF;
END $$;

-- 3. Patch pool_bookings (Consistency)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pool_bookings' AND column_name='gst_amount') THEN
        ALTER TABLE public.pool_bookings ADD COLUMN gst_amount FLOAT8 DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pool_bookings' AND column_name='base_amount') THEN
        ALTER TABLE public.pool_bookings ADD COLUMN base_amount FLOAT8 DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pool_bookings' AND column_name='platform_charge') THEN
        ALTER TABLE public.pool_bookings ADD COLUMN platform_charge FLOAT8 DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pool_bookings' AND column_name='partner_bonus') THEN
        ALTER TABLE public.pool_bookings ADD COLUMN partner_bonus FLOAT8 DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pool_bookings' AND column_name='platform_revenue') THEN
        ALTER TABLE public.pool_bookings ADD COLUMN platform_revenue FLOAT8 DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pool_bookings' AND column_name='partner_total') THEN
        ALTER TABLE public.pool_bookings ADD COLUMN partner_total FLOAT8 DEFAULT 0;
    END IF;
END $$;

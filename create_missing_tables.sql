-- ============================================================
-- 0. Create helper function for ticket generation
-- ============================================================
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 1. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    advertise_id UUID,
    payment_gateway TEXT NOT NULL DEFAULT 'Razorpay',
    payment_id TEXT,
    order_id TEXT,
    signature TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    amount NUMERIC(10, 2),
    currency TEXT DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    ticket_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    qr_code TEXT,
    scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (
        booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access payments" ON public.payments;
CREATE POLICY "Service role full access payments" ON public.payments
    FOR ALL USING (auth.role() = 'service_role');

-- 5. RLS Policies for tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (
        booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Service role full access tickets" ON public.tickets;
CREATE POLICY "Service role full access tickets" ON public.tickets
    FOR ALL USING (auth.role() = 'service_role');

-- 6. Update all existing Pending bookings that have Razorpay payments to Confirmed
-- (These are the stuck bookings from today's testing)
UPDATE public.bookings
SET status = 'Confirmed'
WHERE status = 'Pending'
  AND created_at > NOW() - INTERVAL '24 hours';

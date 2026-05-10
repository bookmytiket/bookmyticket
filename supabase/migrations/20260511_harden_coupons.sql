-- Hardening Event & Coupon System
-- 1. Events Table Enhancements
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS parking_details TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS entry_gate TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS emergency_exit TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS seating_capacity INTEGER;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS video_trailer_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS age_restriction TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS Duration TEXT;

-- 2. Ensure coupons table has all robust features
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS organiser_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS applicable_events UUID[];
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_tickets INT4 DEFAULT 1;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_limit_per_user INT4 DEFAULT 1;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS global_usage_limit INT4;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. Update RLS policies for Organisers
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organisers can view their own coupons" ON public.coupons;
CREATE POLICY "Organisers can view their own coupons" ON public.coupons 
    FOR SELECT USING (organiser_id = auth.uid() OR (is_active = true));

DROP POLICY IF EXISTS "Organisers can manage their own coupons" ON public.coupons;
CREATE POLICY "Organisers can manage their own coupons" ON public.coupons 
    FOR ALL USING (organiser_id = auth.uid());

-- 4. Cleanup: If there are existing coupons without organiser_id, attempt to link them via event_id
UPDATE public.coupons c
SET organiser_id = e.organiser_id
FROM public.events e
WHERE c.event_id = e.id AND c.organiser_id IS NULL;


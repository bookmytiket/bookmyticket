-- Migration: Create event_reviews table with image support
-- Description: Adds a review system for events, similar to vendor_reviews.

-- 1. Create event_reviews table
CREATE TABLE IF NOT EXISTS public.event_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    image_url TEXT,
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS for event_reviews
ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;

-- 3. Policy to allow anyone to view event reviews
DROP POLICY IF EXISTS "Anyone can view event reviews" ON public.event_reviews;
CREATE POLICY "Anyone can view event reviews"
ON public.event_reviews
FOR SELECT
USING (true);

-- 4. Policy to allow authenticated users to add event reviews
DROP POLICY IF EXISTS "Authenticated users can add event reviews" ON public.event_reviews;
CREATE POLICY "Authenticated users can add event reviews"
ON public.event_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Policy to allow users to update their own event reviews
DROP POLICY IF EXISTS "Users can update own event reviews" ON public.event_reviews;
CREATE POLICY "Users can update own event reviews"
ON public.event_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- 6. Add to realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_reviews;

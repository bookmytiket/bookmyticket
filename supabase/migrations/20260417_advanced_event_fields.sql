-- Migration: Add advanced details to events table
-- This adds fields for Venue Features, Event information, and Image Gallery.

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS age_limit TEXT DEFAULT 'All ages',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS safety_measures BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS seating_type TEXT DEFAULT 'FCFS',
ADD COLUMN IF NOT EXISTS mandatory_checkin BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '2-3 Hours';

-- Add comment for documentation
COMMENT ON COLUMN public.events.age_limit IS 'Age restriction for the event (e.g., All ages, 18+, 21+)';
COMMENT ON COLUMN public.events.language IS 'Primary language of the event';
COMMENT ON COLUMN public.events.safety_measures IS 'Whether standard safety measures are implemented';
COMMENT ON COLUMN public.events.seating_type IS 'Type of seating (e.g., FCFS, Reserved, Standing)';
COMMENT ON COLUMN public.events.mandatory_checkin IS 'Whether physical check-in is required at venue';
COMMENT ON COLUMN public.events.gallery IS 'Array of additional event image URLs';
COMMENT ON COLUMN public.events.duration IS 'Approximate duration or specific performance time';

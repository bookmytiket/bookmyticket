-- Add Organiser Category and Display Title fields
ALTER TABLE public.partner_requests
ADD COLUMN IF NOT EXISTS organiser_category TEXT DEFAULT 'Event Organiser',
ADD COLUMN IF NOT EXISTS display_title TEXT;

ALTER TABLE public.organizer_profiles
ADD COLUMN IF NOT EXISTS organiser_category TEXT DEFAULT 'Event Organiser',
ADD COLUMN IF NOT EXISTS display_title TEXT;

-- For existing records, we can populate display_title with business_name or full_name
UPDATE public.organizer_profiles
SET display_title = COALESCE(business_name, business_name, '')
WHERE display_title IS NULL;

-- Notify PostgREST of schema changes
NOTIFY pgrst, 'reload schema';

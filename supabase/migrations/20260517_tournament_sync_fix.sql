
-- 1. Standardize Event Types
UPDATE public.events 
SET type = 'Tournament' 
WHERE type = 'Tournament Event';

-- 2. Ensure all Tournament events have a record in tournament_events
INSERT INTO public.tournament_events (
    id, 
    organiser_id, 
    event_name, 
    sport_type, 
    tournament_format,
    status,
    created_at
)
SELECT 
    e.id, 
    e.organiser_id, 
    e.title, 
    'Cricket', 
    'Knockout', -- Providing a default format to satisfy the NOT NULL constraint
    'published',
    e.created_at
FROM public.events e
LEFT JOIN public.tournament_events te ON e.id = te.id
WHERE e.type = 'Tournament' AND te.id IS NULL;

-- 3. Ensure all Marathon events have a record in marathon_events
INSERT INTO public.marathon_events (
    id,
    organiser_id,
    title,
    created_at
)
SELECT 
    e.id, 
    e.organiser_id, 
    e.title,
    e.created_at
FROM public.events e
LEFT JOIN public.marathon_events me ON e.id = me.id
WHERE e.type = 'Marathon' AND me.id IS NULL;

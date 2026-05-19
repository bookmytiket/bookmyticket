-- Migration: Add end_date and end_time to events table
-- This allows for multi-day events or events with a specific end time.

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS end_time TEXT,
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN public.events.end_date IS 'The concluding date of the event';
COMMENT ON COLUMN public.events.end_time IS 'The concluding time of the event';

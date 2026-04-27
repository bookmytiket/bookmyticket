-- Migration to add sports_details to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sports_details JSONB;

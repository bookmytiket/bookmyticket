-- Enable Supabase Realtime for the organisers table
-- Run this in the Supabase SQL Editor at: supabase.com → SQL Editor
-- This ensures that your Admin panel UI auto-refreshes when making quick-action status modifications!

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.organisers;';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

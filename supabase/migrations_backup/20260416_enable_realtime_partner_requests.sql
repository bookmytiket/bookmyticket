-- Enable Realtime for partner_requests table
BEGIN;
  -- Add table to the supabase_realtime publication if not already present
  -- We use a DO block to avoid errors if it's already added or publication doesn't exist
  DO $$ 
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_requests;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if table is already in publication
    NULL;
  END $$;
COMMIT;

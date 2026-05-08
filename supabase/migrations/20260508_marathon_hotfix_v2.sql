-- HOTFIX: Ensure missing columns exist in marathon_events
-- This handles cases where the table might have been created without certain V2 fields.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='zip_code') THEN
        ALTER TABLE public.marathon_events ADD COLUMN zip_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='district') THEN
        ALTER TABLE public.marathon_events ADD COLUMN district TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='awareness_text') THEN
        ALTER TABLE public.marathon_events ADD COLUMN awareness_text TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='subtitle') THEN
        ALTER TABLE public.marathon_events ADD COLUMN subtitle TEXT;
    END IF;
END $$;

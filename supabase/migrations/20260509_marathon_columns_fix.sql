-- MARATHON EVENTS V2 COLUMNS FIX
-- Safely add all columns that the MarathonEventForm V2 requires.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='reg_start_date') THEN
        ALTER TABLE public.marathon_events ADD COLUMN reg_start_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='reg_end_date') THEN
        ALTER TABLE public.marathon_events ADD COLUMN reg_end_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='expiry_date') THEN
        ALTER TABLE public.marathon_events ADD COLUMN expiry_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='event_end_date') THEN
        ALTER TABLE public.marathon_events ADD COLUMN event_end_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='event_end_time') THEN
        ALTER TABLE public.marathon_events ADD COLUMN event_end_time TIME;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='whatsapp_link') THEN
        ALTER TABLE public.marathon_events ADD COLUMN whatsapp_link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='support_number') THEN
        ALTER TABLE public.marathon_events ADD COLUMN support_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='terms') THEN
        ALTER TABLE public.marathon_events ADD COLUMN terms TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='subtitle') THEN
        ALTER TABLE public.marathon_events ADD COLUMN subtitle TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='awareness_text') THEN
        ALTER TABLE public.marathon_events ADD COLUMN awareness_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_events' AND column_name='updated_at') THEN
        ALTER TABLE public.marathon_events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- Ensure marathon_categories supports both FK column names for backward compatibility
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marathon_categories' AND column_name='event_id') THEN
        ALTER TABLE public.marathon_categories ADD COLUMN event_id UUID;
    END IF;
END $$;

-- Add organiser SELECT policy so drafts are visible to the organiser (RLS fix)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'marathon_events' 
        AND policyname = 'Organisers can view their own marathons'
    ) THEN
        CREATE POLICY "Organisers can view their own marathons"
        ON public.marathon_events FOR SELECT
        USING (auth.uid() = organiser_id);
    END IF;
END $$;

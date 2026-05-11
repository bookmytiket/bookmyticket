-- Migration to add missing fields to marathon_events table
-- Run this in the Supabase SQL Editor to fix the schema cache errors

DO $$ 
BEGIN 
    -- Add all the missing columns that the Organiser frontend tries to save
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

    -- Note: marathon_categories correctly uses 'title' and 'total_slots', NOT 'category_name' and 'slots_total'. 
    -- We've updated the frontend React code to match the existing 'title' column, so no table alteration is needed for categories.
    
    -- Refresh the schema cache
    NOTIFY pgrst, 'reload schema';
END $$;

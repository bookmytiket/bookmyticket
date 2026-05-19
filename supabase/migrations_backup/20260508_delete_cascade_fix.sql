-- MIGRATION: Add ON DELETE CASCADE to bookings
-- Ensures that when an event is deleted, all associated bookings are also removed.

ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_event_id_fkey,
ADD CONSTRAINT bookings_event_id_fkey
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE CASCADE;

-- Also ensure marathon_registrations has CASCADE if not already set correctly
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='marathon_registrations_marathon_id_fkey') THEN
        ALTER TABLE public.marathon_registrations DROP CONSTRAINT marathon_registrations_marathon_id_fkey;
    END IF;
    
    ALTER TABLE public.marathon_registrations
    ADD CONSTRAINT marathon_registrations_marathon_id_fkey
        FOREIGN KEY (marathon_id)
        REFERENCES public.marathon_events(id)
        ON DELETE CASCADE;
END $$;
